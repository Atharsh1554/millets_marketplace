import { db } from "@/server/db";

/**
 * Read-only, farmer-scoped views of the procurement chain.
 * Everything is filtered by the farmer's own procurements. Customer identities, selling prices,
 * revenue and margins are intentionally NOT exposed (business rule: farmer earnings only).
 */

export async function farmerBatches(farmerId: string) {
  return db.batch.findMany({
    where: { procurement: { farmerId } },
    orderBy: { createdAt: "desc" },
    include: {
      procurement: {
        select: {
          code: true,
          actualQuantityGrams: true,
          receivedDate: true,
          status: true,
          submission: { select: { id: true, code: true, title: true, physicalTest: { select: { code: true, testDate: true } } } },
        },
      },
      inventory: {
        select: {
          quantityReceivedGrams: true,
          quantityAvailableGrams: true,
          quantitySoldGrams: true,
          status: true,
          storageLocation: true,
          products: { select: { id: true, name: true, status: true, slug: true, weightGrams: true } },
        },
      },
    },
  });
}

export async function farmerProducts(farmerId: string) {
  return db.product.findMany({
    where: { inventory: { batch: { procurement: { farmerId } } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      milletType: true,
      weightGrams: true,
      status: true,
      publishedAt: true,
      images: { take: 1, select: { url: true } },
      inventory: { select: { quantityAvailableGrams: true, batch: { select: { batchNumber: true } } } },
      _count: { select: { reviews: true } },
    },
  });
}

/** Customer order lines that contain products made from this farmer's batches (no customer PII). */
export async function farmerOrderItems(farmerId: string) {
  return db.orderItem.findMany({
    where: { inventory: { batch: { procurement: { farmerId } } } },
    orderBy: { order: { placedAt: "desc" } },
    take: 300,
    select: {
      id: true,
      productName: true,
      weightGrams: true,
      quantity: true,
      inventory: { select: { batch: { select: { batchNumber: true } } } },
      order: { select: { code: true, status: true, placedAt: true, shipCity: true, shipState: true, deliveredAt: true } },
    },
  });
}
