import type { HardwareCategory, HardwareEnquiryStatus, HardwareStatus, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { AppError, NotFoundError } from "@/server/errors";
import { getStorage, validateUpload } from "@/server/storage";
import { hardwareEnquirySchema, hardwareEnquiryUpdateSchema, hardwareSchema, hardwareStatusSchema } from "@/server/validation";
import { msg } from "@/i18n/translate";
import { notifyRole, notifyUser } from "./notifications";
import { assertRole, type Actor } from "./types";

/**
 * FEATURED HARDWARE — equipment farmers can learn about and enquire for.
 * Admins manage the catalogue; farmers can only read PUBLISHED products and send enquiries.
 */

export const MAX_HARDWARE_IMAGES = 8;

/** Placeholder illustration per category when no photo has been uploaded (static asset, not user data). */
export const HARDWARE_PLACEHOLDER: Record<HardwareCategory, string> = {
  PROCESSING: "/hardware/processing.svg",
  DEHULLING: "/hardware/dehulling.svg",
  CLEANING: "/hardware/cleaning.svg",
  DRYING: "/hardware/drying.svg",
  STORAGE: "/hardware/storage.svg",
  WEIGHING: "/hardware/weighing.svg",
  CROP_PROTECTION: "/hardware/crop-protection.svg",
  OTHER: "/hardware/other.svg",
};

/** Splits a one-item-per-line field into a clean list. */
export function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

/** "Label: Value" lines → specification rows. */
export function specRows(text: string): Array<[string, string]> {
  return lines(text).map((l) => {
    const i = l.indexOf(":");
    return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, ""];
  });
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "hardware"
  );
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const hit = await db.hardwareProduct.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

/** Validates and stores images through the storage abstraction (local in dev, Supabase/S3 in production). */
async function storeImages(files: File[], existing: number) {
  if (existing + files.length > MAX_HARDWARE_IMAGES) throw new AppError(`Upload at most ${MAX_HARDWARE_IMAGES} images per product.`);
  const validated = await Promise.all(files.map((f) => validateUpload(f, ["image"])));
  const storage = getStorage();
  const urls: string[] = [];
  for (const v of validated) urls.push((await storage.save(v, "hardware")).url);
  return urls;
}

// ───────────── Admin: catalogue management ─────────────

export async function createHardware(actor: Actor, raw: unknown, images: File[]) {
  assertRole(actor, ["ADMIN"]);
  const input = hardwareSchema.parse(raw);
  const urls = await storeImages(images, 0);
  return db.hardwareProduct.create({
    data: {
      ...input,
      slug: await uniqueSlug(input.name),
      status: "DRAFT",
      images: { create: urls.map((url, i) => ({ url, alt: input.name, sortOrder: i })) },
    },
  });
}

export async function updateHardware(actor: Actor, id: string, raw: unknown, images: File[]) {
  assertRole(actor, ["ADMIN"]);
  const product = await db.hardwareProduct.findUnique({ where: { id }, include: { images: true } });
  if (!product) throw new NotFoundError("Hardware product");
  const input = hardwareSchema.parse(raw);
  const urls = await storeImages(images, product.images.length);
  const start = product.images.reduce((m, i) => Math.max(m, i.sortOrder + 1), 0);
  return db.hardwareProduct.update({
    where: { id },
    data: {
      ...input,
      slug: input.name === product.name ? product.slug : await uniqueSlug(input.name, id),
      images: { create: urls.map((url, i) => ({ url, alt: input.name, sortOrder: start + i })) },
    },
  });
}

export async function deleteHardwareImage(actor: Actor, imageId: string) {
  assertRole(actor, ["ADMIN"]);
  const img = await db.hardwareProductImage.findUnique({ where: { id: imageId } });
  if (!img) throw new NotFoundError("Image");
  await db.hardwareProductImage.delete({ where: { id: imageId } });
}

/** Publish / unpublish (back to draft) / archive. */
export async function setHardwareStatus(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = hardwareStatusSchema.parse(raw);
  const product = await db.hardwareProduct.findUnique({ where: { id: input.productId } });
  if (!product) throw new NotFoundError("Hardware product");
  await db.hardwareProduct.update({
    where: { id: product.id },
    data: { status: input.status as HardwareStatus, publishedAt: input.status === "PUBLISHED" ? (product.publishedAt ?? new Date()) : product.publishedAt },
  });
}

export async function adminListHardware() {
  return db.hardwareProduct.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, _count: { select: { enquiries: true } } },
  });
}

export async function hardwareById(id: string) {
  return db.hardwareProduct.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } });
}

// ───────────── Farmer: browse & enquire ─────────────

const cardInclude = { images: { orderBy: { sortOrder: "asc" }, take: 1 } } satisfies Prisma.HardwareProductInclude;

/** Published hardware only. */
export async function listPublishedHardware(category?: string) {
  const where: Prisma.HardwareProductWhereInput = { status: "PUBLISHED" };
  if (category && category in HARDWARE_PLACEHOLDER) where.category = category as HardwareCategory;
  return db.hardwareProduct.findMany({ where, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], include: cardInclude });
}

export type HardwareCardData = Awaited<ReturnType<typeof listPublishedHardware>>[number];

export async function featuredHardware(take = 3) {
  return db.hardwareProduct.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take, include: cardInclude });
}

/** A published product by slug (farmers never see drafts or archived products). */
export async function publishedHardwareBySlug(slug: string) {
  return db.hardwareProduct.findFirst({ where: { slug, status: "PUBLISHED" }, include: { images: { orderBy: { sortOrder: "asc" } } } });
}

export async function createEnquiry(actor: Actor, raw: unknown) {
  assertRole(actor, ["FARMER"]);
  const input = hardwareEnquirySchema.parse(raw);
  const product = await db.hardwareProduct.findFirst({ where: { id: input.productId, status: "PUBLISHED" } });
  if (!product) throw new AppError(msg("errors.hardwareUnavailable"));
  return db.$transaction(async (tx) => {
    const enquiry = await tx.hardwareEnquiry.create({
      data: {
        userId: actor.id,
        productId: product.id,
        quantity: input.quantity,
        requirement: input.requirement ?? null,
        message: input.message,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
      },
    });
    await notifyRole(tx, ["ADMIN"], "New hardware enquiry", `${input.contactName} · ${product.name} × ${input.quantity}`, `/admin/hardware/enquiries`);
    return enquiry;
  });
}

export async function myEnquiries(userId: string) {
  return db.hardwareEnquiry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true, status: true, category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
  });
}

// ───────────── Admin: enquiries ─────────────

export async function adminEnquiries(status?: string) {
  const where: Prisma.HardwareEnquiryWhereInput = {};
  if (status && ["NEW", "CONTACTED", "IN_DISCUSSION", "COMPLETED", "CANCELLED"].includes(status)) where.status = status as HardwareEnquiryStatus;
  return db.hardwareEnquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true, farmer: { select: { village: true, district: true, state: true } } } },
      product: { select: { id: true, name: true } },
    },
  });
}

export async function updateEnquiry(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = hardwareEnquiryUpdateSchema.parse(raw);
  const enquiry = await db.hardwareEnquiry.findUnique({ where: { id: input.enquiryId }, include: { product: { select: { name: true } } } });
  if (!enquiry) throw new NotFoundError("Enquiry");
  await db.$transaction(async (tx) => {
    await tx.hardwareEnquiry.update({ where: { id: enquiry.id }, data: { status: input.status, adminNote: input.adminNote ?? enquiry.adminNote } });
    if (input.status !== enquiry.status) {
      await notifyUser(
        tx,
        enquiry.userId,
        msg("notif.enquiry.title"),
        msg("notif.enquiry.body", { product: enquiry.product.name, status: msg(`labels.enquiryStatus.${input.status}`) }),
        "/farmer/hardware/enquiries",
      );
    }
  });
}
