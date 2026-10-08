import type { Prisma } from "@prisma/client";
import { msg } from "@/i18n/translate";
import { db, type Tx } from "@/server/db";
import { AppError, NotFoundError } from "@/server/errors";
import { getStorage, validateUpload } from "@/server/storage";
import { inventoryUpdateSchema, productSchema, productUpdateSchema } from "@/server/validation";
import { setHarvestStatus } from "./harvest";
import { assertRole, type Actor } from "./types";
import { kgToGrams, rupeesToPaise } from "@/lib/format";

/**
 * The marketplace gate (business rules 6–8). A product is visible to customers ONLY when its
 * inventory lot traces back to: admin-approved submission → physical test PASSED → procurement stored.
 */
export const BATCH_GATE: Prisma.BatchWhereInput = {
  procurement: {
    status: { in: ["STORED", "READY_FOR_MARKETPLACE"] },
    submission: {
      adminReviews: { some: { decision: "APPROVED" } },
      physicalTest: { is: { status: "PASSED" } },
    },
  },
};

export const MARKETPLACE_GATE: Prisma.ProductWhereInput = { inventory: { batch: BATCH_GATE } };

export const PUBLIC_PRODUCT_WHERE: Prisma.ProductWhereInput = {
  status: { in: ["AVAILABLE_FOR_SALE", "SOLD_OUT"] },
  ...MARKETPLACE_GATE,
};

export const DEFAULT_PRODUCT_IMAGE: Record<string, string> = {
  FINGER_MILLET: "/products/finger-millet.svg",
  PEARL_MILLET: "/products/pearl-millet.svg",
  FOXTAIL_MILLET: "/products/foxtail-millet.svg",
  LITTLE_MILLET: "/products/little-millet.svg",
  KODO_MILLET: "/products/kodo-millet.svg",
  BARNYARD_MILLET: "/products/barnyard-millet.svg",
  PROSO_MILLET: "/products/proso-millet.svg",
  BROWNTOP_MILLET: "/products/browntop-millet.svg",
  SORGHUM: "/products/sorghum.svg",
  MIXED: "/products/mixed-millet.svg",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function uniqueSlug(tx: Tx, base: string) {
  let slug = slugify(base) || "product";
  for (let i = 2; await tx.product.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${slugify(base)}-${i}`;
  return slug;
}

/**
 * Recomputes stock status after any quantity change:
 * inventory IN_STOCK / LOW_STOCK / OUT_OF_STOCK, product SOLD_OUT ⇄ AVAILABLE_FOR_SALE, harvest SOLD_OUT.
 */
export async function recalcInventory(tx: Tx, inventoryId: string) {
  const inv = await tx.inventory.findUnique({ where: { id: inventoryId }, include: { products: true, batch: { include: { procurement: true } } } });
  if (!inv) return;
  const status = inv.quantityAvailableGrams <= 0 ? "OUT_OF_STOCK" : inv.quantityAvailableGrams <= inv.lowStockThresholdGrams ? "LOW_STOCK" : "IN_STOCK";
  if (status !== inv.status) await tx.inventory.update({ where: { id: inv.id }, data: { status } });

  for (const p of inv.products) {
    const canSellOne = inv.quantityAvailableGrams >= p.weightGrams;
    if (p.status === "AVAILABLE_FOR_SALE" && !canSellOne) await tx.product.update({ where: { id: p.id }, data: { status: "SOLD_OUT" } });
    if (p.status === "SOLD_OUT" && canSellOne) await tx.product.update({ where: { id: p.id }, data: { status: "AVAILABLE_FOR_SALE" } });
  }

  const submissionId = inv.batch.procurement.submissionId;
  const sub = await tx.harvestSubmission.findUnique({ where: { id: submissionId }, select: { status: true } });
  if (status === "OUT_OF_STOCK" && sub?.status === "AVAILABLE_FOR_SALE") {
    await setHarvestStatus(tx, submissionId, "SOLD_OUT", msg("events.soldOut"), null);
  } else if (status !== "OUT_OF_STOCK" && sub?.status === "SOLD_OUT") {
    await setHarvestStatus(tx, submissionId, "AVAILABLE_FOR_SALE", msg("events.restocked"), null);
  }
}

async function storeProductImage(file: File | null) {
  if (!file || file.size === 0) return null;
  const v = await validateUpload(file, ["image"]);
  return (await getStorage().save(v, "products")).url;
}

/** Admin creates a marketplace listing from an inventory lot. Starts as MARKETPLACE_APPROVED (not yet visible). */
export async function createProduct(actor: Actor, raw: unknown, image: File | null) {
  assertRole(actor, ["ADMIN"]);
  const input = productSchema.parse(raw);
  const inv = await db.inventory.findFirst({
    where: { id: input.inventoryId, batch: BATCH_GATE },
    include: { batch: { include: { procurement: true } } },
  });
  if (!inv) throw new AppError("This inventory lot has not completed admin review, physical testing and procurement.");
  if (input.weightGrams > inv.quantityAvailableGrams) throw new AppError("Pack size exceeds the available inventory.");
  const imageUrl = (await storeProductImage(image)) ?? DEFAULT_PRODUCT_IMAGE[inv.batch.milletType] ?? DEFAULT_PRODUCT_IMAGE.MIXED;

  return db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        slug: await uniqueSlug(tx, `${input.name}-${input.weightGrams >= 1000 ? `${input.weightGrams / 1000}kg` : `${input.weightGrams}g`}`),
        name: input.name,
        category: input.category,
        milletType: inv.batch.milletType,
        weightGrams: input.weightGrams,
        pricePaise: rupeesToPaise(input.price),
        mrpPaise: rupeesToPaise(input.mrp),
        description: input.description,
        featured: input.featured,
        status: "MARKETPLACE_APPROVED",
        inventoryId: inv.id,
        images: { create: [{ url: imageUrl, alt: input.name }] },
      },
    });
    if (inv.batch.procurement.status === "STORED") {
      await tx.procurement.update({ where: { id: inv.batch.procurementId }, data: { status: "READY_FOR_MARKETPLACE" } });
    }
    const sub = await tx.harvestSubmission.findUnique({ where: { id: inv.batch.procurement.submissionId }, select: { status: true } });
    if (sub?.status === "PROCURED") await setHarvestStatus(tx, inv.batch.procurement.submissionId, "MARKETPLACE_APPROVED", msg("events.listed", { name: input.name }), actor.id);
    return product;
  });
}

export async function updateProduct(actor: Actor, raw: unknown, image: File | null) {
  assertRole(actor, ["ADMIN"]);
  const input = productUpdateSchema.parse(raw);
  const product = await db.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new NotFoundError("Product");
  const imageUrl = await storeProductImage(image);
  await db.product.update({
    where: { id: product.id },
    data: {
      name: input.name,
      pricePaise: rupeesToPaise(input.price),
      mrpPaise: rupeesToPaise(input.mrp),
      description: input.description,
      featured: input.featured,
      ...(imageUrl ? { images: { deleteMany: {}, create: [{ url: imageUrl, alt: input.name }] } } : {}),
    },
  });
}

/** Publish = make visible to customers. Re-checks the marketplace gate server-side. */
export async function publishProduct(actor: Actor, productId: string) {
  assertRole(actor, ["ADMIN"]);
  const product = await db.product.findFirst({ where: { id: productId, ...MARKETPLACE_GATE }, include: { inventory: { include: { batch: { include: { procurement: true } } } } } });
  if (!product) throw new AppError("Product cannot be published: its batch has not passed every verification stage.");
  if (!["MARKETPLACE_APPROVED", "ARCHIVED", "DRAFT"].includes(product.status)) throw new AppError("Product is already published.");
  if (product.inventory.quantityAvailableGrams < product.weightGrams) throw new AppError("Not enough inventory to publish this pack size.");

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: product.id }, data: { status: "AVAILABLE_FOR_SALE", publishedAt: product.publishedAt ?? new Date() } });
    const subId = product.inventory.batch.procurement.submissionId;
    const sub = await tx.harvestSubmission.findUnique({ where: { id: subId }, select: { status: true } });
    if (sub && ["PROCURED", "MARKETPLACE_APPROVED"].includes(sub.status)) {
      if (sub.status === "PROCURED") await setHarvestStatus(tx, subId, "MARKETPLACE_APPROVED", null, actor.id);
      await setHarvestStatus(tx, subId, "AVAILABLE_FOR_SALE", msg("events.available"), actor.id);
    }
  });
}

export async function archiveProduct(actor: Actor, productId: string) {
  assertRole(actor, ["ADMIN"]);
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("Product");
  await db.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } });
}

export async function updateInventory(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = inventoryUpdateSchema.parse(raw);
  await db.$transaction(async (tx) => {
    await tx.inventory.update({
      where: { id: input.inventoryId },
      data: {
        sellingPricePerKgPaise: rupeesToPaise(input.sellingPricePerKg),
        lowStockThresholdGrams: kgToGrams(input.lowStockThresholdKg),
        storageLocation: input.storageLocation,
      },
    });
    await recalcInventory(tx, input.inventoryId);
  });
}

// ───────────── Queries ─────────────

export async function listInventory() {
  return db.inventory.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      batch: { include: { procurement: { include: { farmer: { include: { user: { select: { name: true } } } }, submission: { select: { title: true, code: true } } } } } },
      products: { select: { id: true, name: true, status: true, weightGrams: true, slug: true } },
    },
  });
}

export async function inventoryDetail(id: string) {
  return db.inventory.findUnique({
    where: { id },
    include: {
      batch: { include: { procurement: { include: { farmer: { include: { user: { select: { name: true } } } }, submission: true } } } },
      products: { include: { images: true } },
    },
  });
}

export async function listAdminProducts() {
  return db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1 }, inventory: { include: { batch: { select: { batchNumber: true } } } } },
  });
}
