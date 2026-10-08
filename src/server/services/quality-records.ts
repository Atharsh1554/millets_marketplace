import { db } from "@/server/db";

/** Procured batches with the physical test that cleared them. */
export async function inspectedBatches() {
  return db.batch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      inventory: { select: { quantityReceivedGrams: true, quantityAvailableGrams: true, status: true } },
      procurement: {
        select: {
          code: true,
          farmer: { select: { user: { select: { name: true } } } },
          submission: {
            select: {
              title: true,
              physicalTest: { select: { id: true, code: true, testDate: true, testedBy: { select: { name: true } }, results: { select: { outcome: true } } } },
            },
          },
        },
      },
    },
  });
}

/** Physical tests with outcome, plus what happened downstream (batch & products). */
export async function testOutcomes(status: "PASSED" | "FAILED") {
  return db.physicalTest.findMany({
    where: { status },
    orderBy: { testDate: "desc" },
    include: {
      testedBy: { select: { name: true } },
      submission: {
        select: {
          title: true,
          code: true,
          milletType: true,
          quantityGrams: true,
          contactName: true,
          district: true,
          procurement: { select: { status: true, batch: { select: { batchNumber: true, inventory: { select: { products: { select: { name: true, status: true } } } } } } } },
        },
      },
    },
  });
}

export async function testsWithAttachments() {
  return db.physicalTest.findMany({
    where: { status: { in: ["SAMPLE_COLLECTED", "TESTING", "ADDITIONAL_TESTING_REQUIRED"] } },
    orderBy: { createdAt: "desc" },
    include: { submission: { select: { title: true, code: true } }, attachments: { orderBy: { createdAt: "desc" } } },
  });
}
