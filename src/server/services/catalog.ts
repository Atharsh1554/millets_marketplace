import type { MilletType, Prisma, ProductCategory } from "@prisma/client";
import { db } from "@/server/db";
import { CATEGORY_LABEL, MILLET_LABEL } from "@/lib/labels";
import { en } from "@/i18n/dictionaries/en";
import { ta } from "@/i18n/dictionaries/ta";
import { ml } from "@/i18n/dictionaries/ml";
import { hi } from "@/i18n/dictionaries/hi";

/** Millet/category names in every supported language, so "ராகி", "रागी" or "ragi" all find ragi products. */
const DICTS = [en, ta, ml, hi];
const milletNames = (k: string) => DICTS.flatMap((d) => [d.labels.millet[k as keyof typeof d.labels.millet], d.labels.milletShort[k as keyof typeof d.labels.milletShort]]).filter(Boolean);
const categoryNames = (k: string) => DICTS.map((d) => d.labels.category[k as keyof typeof d.labels.category]).filter(Boolean);
import { PUBLIC_PRODUCT_WHERE } from "./inventory";

export type ShopFilters = {
  q?: string;
  category?: string;
  millet?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: "price_asc" | "price_desc" | "rating" | "popular" | "newest";
};

const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  inventory: { select: { quantityAvailableGrams: true, status: true } },
} satisfies Prisma.ProductInclude;

/** Customer-facing product search. Always constrained by PUBLIC_PRODUCT_WHERE (the marketplace gate). */
export async function searchProducts(f: ShopFilters) {
  const and: Prisma.ProductWhereInput[] = [PUBLIC_PRODUCT_WHERE];

  if (f.q) {
    const q = f.q.trim().toLowerCase();
    // Search across product name, millet type and category (labels included, e.g. "ragi", "flour").
    const millets = Object.keys(MILLET_LABEL)
      .filter((k) => k.toLowerCase().replace("_", " ").includes(q) || milletNames(k).some((n) => n.toLowerCase().includes(q)))
      .map((k) => k as MilletType);
    const cats = Object.keys(CATEGORY_LABEL)
      .filter((k) => k.toLowerCase().includes(q) || categoryNames(k).some((n) => n.toLowerCase().includes(q)))
      .map((k) => k as ProductCategory);
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        ...(millets.length ? [{ milletType: { in: millets } }] : []),
        ...(cats.length ? [{ category: { in: cats } }] : []),
      ],
    });
  }
  if (f.category && f.category in CATEGORY_LABEL) and.push({ category: f.category as ProductCategory });
  if (f.millet && f.millet in MILLET_LABEL) and.push({ milletType: f.millet as MilletType });
  if (f.minPrice) and.push({ pricePaise: { gte: Math.round(f.minPrice * 100) } });
  if (f.maxPrice) and.push({ pricePaise: { lte: Math.round(f.maxPrice * 100) } });
  if (f.inStock) and.push({ status: "AVAILABLE_FOR_SALE" });

  const products = await db.product.findMany({ where: { AND: and }, include: productCardInclude });
  const stats = await productStats(products.map((p) => p.id));

  let rows = products.map((p) => ({ ...p, rating: stats.ratings.get(p.id) ?? { avg: 0, count: 0 }, sold: stats.sold.get(p.id) ?? 0 }));
  if (f.minRating) rows = rows.filter((r) => r.rating.avg >= f.minRating!);

  const sorters: Record<string, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    price_asc: (a, b) => a.pricePaise - b.pricePaise,
    price_desc: (a, b) => b.pricePaise - a.pricePaise,
    rating: (a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count,
    popular: (a, b) => b.sold - a.sold,
    newest: (a, b) => +(b.publishedAt ?? b.createdAt) - +(a.publishedAt ?? a.createdAt),
  };
  rows.sort(sorters[f.sort ?? "popular"] ?? sorters.popular);
  // In-stock items first, keeping the chosen order otherwise.
  rows.sort((a, b) => Number(b.status === "AVAILABLE_FOR_SALE") - Number(a.status === "AVAILABLE_FOR_SALE"));
  return rows;
}

export type ProductCardData = Awaited<ReturnType<typeof searchProducts>>[number];

async function productStats(ids: string[]) {
  if (ids.length === 0) return { ratings: new Map<string, { avg: number; count: number }>(), sold: new Map<string, number>() };
  const [ratings, sold] = await Promise.all([
    db.review.groupBy({ by: ["productId"], where: { productId: { in: ids } }, _avg: { rating: true }, _count: { _all: true } }),
    db.orderItem.groupBy({ by: ["productId"], where: { productId: { in: ids }, order: { status: { not: "CANCELLED" } } }, _sum: { quantity: true } }),
  ]);
  return {
    ratings: new Map(ratings.map((r) => [r.productId, { avg: r._avg.rating ?? 0, count: r._count._all }])),
    sold: new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0])),
  };
}

export async function featuredProducts(take = 8) {
  const rows = await searchProducts({ sort: "popular", inStock: true });
  return [...rows.filter((r) => r.featured), ...rows.filter((r) => !r.featured)].slice(0, take);
}

/** Product detail incl. full traceability chain. Returns null for anything not past the marketplace gate. */
export async function productBySlug(slug: string) {
  const product = await db.product.findFirst({
    where: { AND: [{ slug }, PUBLIC_PRODUCT_WHERE] },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      inventory: {
        include: {
          batch: {
            include: {
              procurement: {
                include: {
                  farmer: { include: { user: { select: { name: true } } } },
                  submission: {
                    select: {
                      harvestDate: true,
                      village: true,
                      district: true,
                      state: true,
                      cultivationMethod: true,
                      processingMethod: true,
                      adminReviews: { where: { decision: "APPROVED" }, select: { createdAt: true }, take: 1 },
                      physicalTest: { select: { status: true, testDate: true, code: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      reviews: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });
  if (!product) return null;
  const stats = await productStats([product.id]);
  return { ...product, rating: stats.ratings.get(product.id) ?? { avg: 0, count: 0 }, sold: stats.sold.get(product.id) ?? 0 };
}

export async function relatedProducts(milletType: MilletType, excludeId: string) {
  const rows = await searchProducts({ millet: milletType, inStock: true });
  return rows.filter((r) => r.id !== excludeId).slice(0, 4);
}

export async function categoryCounts() {
  const [byCategory, byMillet] = await Promise.all([
    db.product.groupBy({ by: ["category"], where: PUBLIC_PRODUCT_WHERE, _count: { _all: true } }),
    db.product.groupBy({ by: ["milletType"], where: PUBLIC_PRODUCT_WHERE, _count: { _all: true } }),
  ]);
  return {
    category: Object.fromEntries(byCategory.map((c) => [c.category, c._count._all])) as Record<string, number>,
    millet: Object.fromEntries(byMillet.map((c) => [c.milletType, c._count._all])) as Record<string, number>,
  };
}

/** Units of a pack that can be sold right now from its inventory lot. */
export function unitsAvailable(p: { weightGrams: number; inventory: { quantityAvailableGrams: number } }) {
  return Math.floor(p.inventory.quantityAvailableGrams / p.weightGrams);
}
