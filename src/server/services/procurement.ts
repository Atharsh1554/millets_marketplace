import { db } from "@/server/db";
import { msg } from "@/i18n/translate";
import { AppError, NotFoundError } from "@/server/errors";
import {
  farmerPaymentUpdateSchema,
  moveToInventorySchema,
  procurementCollectedSchema,
  procurementReceiptSchema,
  procurementScheduleSchema,
  procurementTermsSchema,
} from "@/server/validation";
import { codes } from "./codes";
import { setHarvestStatus } from "./harvest";
import { notifyUser } from "./notifications";
import { assertRole, type Actor } from "./types";
import { farmerAmountPaise, formatINR, kgToGrams, rupeesToPaise } from "@/lib/format";

/**
 * PROCUREMENT — our organization takes the physically-approved harvest from the farmer.
 * Only harvests whose physical test PASSED ever get a Procurement row (created by testing.submitTestResult).
 */
async function load(procurementId: string) {
  const p = await db.procurement.findUnique({
    where: { id: procurementId },
    include: { submission: { include: { physicalTest: true } }, farmer: true, farmerPayment: true, batch: true },
  });
  if (!p) throw new NotFoundError("Procurement");
  if (p.submission.physicalTest?.status !== "PASSED") throw new AppError("Only physically-tested and passed harvests can be procured.");
  return p;
}

export async function updateTerms(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = procurementTermsSchema.parse(raw);
  const p = await load(input.procurementId);
  if (!["PROCUREMENT_PENDING", "COLLECTION_SCHEDULED"].includes(p.status)) throw new AppError("Terms are locked once the harvest is collected.");
  const grams = kgToGrams(input.approvedQuantityKg);
  if (grams > p.submission.quantityGrams) throw new AppError("Approved quantity cannot exceed the farmer's available quantity.");
  await db.procurement.update({ where: { id: p.id }, data: { approvedQuantityGrams: grams, agreedPricePerKgPaise: rupeesToPaise(input.agreedPricePerKg) } });
}

export async function scheduleProcurement(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = procurementScheduleSchema.parse(raw);
  const p = await load(input.procurementId);
  if (!["PROCUREMENT_PENDING", "COLLECTION_SCHEDULED"].includes(p.status)) throw new AppError("Collection can no longer be rescheduled.");
  await db.$transaction(async (tx) => {
    await tx.procurement.update({ where: { id: p.id }, data: { status: "COLLECTION_SCHEDULED", scheduledDate: input.scheduledDate, collectedBy: input.collectedBy } });
    await notifyUser(
      tx,
      p.farmer.userId,
      msg("notif.collectionScheduled.title"),
      msg("notif.collectionScheduled.body", { team: input.collectedBy, date: input.scheduledDate.toISOString().slice(0, 10) }),
      `/farmer/harvests/${p.submissionId}`,
    );
  });
}

export async function markCollected(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = procurementCollectedSchema.parse(raw);
  const p = await load(input.procurementId);
  if (p.status !== "COLLECTION_SCHEDULED") throw new AppError("Schedule the collection first.");
  const grams = kgToGrams(input.actualQuantityKg);
  if (grams > p.approvedQuantityGrams) throw new AppError("Collected quantity cannot exceed the approved quantity.");
  await db.procurement.update({
    where: { id: p.id },
    data: { status: "COLLECTED", collectionDate: input.collectionDate, actualQuantityGrams: grams, collectedBy: input.collectedBy },
  });
}

/** Receipt at our warehouse: harvest is now procured and the farmer payment becomes due. */
export async function confirmReceipt(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = procurementReceiptSchema.parse(raw);
  const p = await load(input.procurementId);
  if (p.status !== "COLLECTED" || !p.actualQuantityGrams) throw new AppError("Mark the harvest as collected first.");
  const amount = farmerAmountPaise(p.actualQuantityGrams, p.agreedPricePerKgPaise);

  await db.$transaction(async (tx) => {
    await tx.procurement.update({ where: { id: p.id }, data: { status: "RECEIVED", receivedDate: input.receivedDate, storageLocation: input.storageLocation } });
    await tx.farmerPayment.create({
      data: {
        procurementId: p.id,
        farmerId: p.farmerId,
        approvedQuantityGrams: p.approvedQuantityGrams,
        quantityGrams: p.actualQuantityGrams!,
        pricePerKgPaise: p.agreedPricePerKgPaise,
        totalAmountPaise: amount,
        status: "PENDING",
      },
    });
    await setHarvestStatus(tx, p.submissionId, "PROCURED", msg("events.procured", { kg: p.actualQuantityGrams! / 1000 }), actor.id);
    await notifyUser(tx, p.farmer.userId, msg("notif.procured.title"), msg("notif.procured.body", { amount: formatINR(amount) }), `/farmer/payments`);
  });
}

/** Creates the traceable Batch + Inventory lot. */
export async function moveToInventory(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = moveToInventorySchema.parse(raw);
  const p = await load(input.procurementId);
  if (p.status !== "RECEIVED" || !p.actualQuantityGrams || !p.storageLocation) throw new AppError("Confirm receipt before moving to inventory.");
  if (p.batch) throw new AppError("This procurement is already in inventory.");

  return db.$transaction(async (tx) => {
    const batchNumber = await codes.batch(tx);
    const batch = await tx.batch.create({
      data: { batchNumber, procurementId: p.id, milletType: p.milletType, harvestYear: p.submission.harvestDate.getFullYear() },
    });
    const inv = await tx.inventory.create({
      data: {
        batchId: batch.id,
        quantityReceivedGrams: p.actualQuantityGrams!,
        quantityAvailableGrams: p.actualQuantityGrams!,
        storageLocation: p.storageLocation!,
        purchasePricePerKgPaise: p.agreedPricePerKgPaise,
        sellingPricePerKgPaise: rupeesToPaise(input.sellingPricePerKg),
        lowStockThresholdGrams: kgToGrams(input.lowStockThresholdKg),
        status: "IN_STOCK",
      },
    });
    await tx.procurement.update({ where: { id: p.id }, data: { status: "STORED" } });
    return inv;
  });
}

// ───────────── Farmer payments (separate from sales revenue) ─────────────

const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "PAID", "FAILED"],
  PROCESSING: ["PAID", "FAILED"],
  FAILED: ["PROCESSING", "PAID"],
  PAID: [],
};

export async function updateFarmerPayment(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = farmerPaymentUpdateSchema.parse(raw);
  const pay = await db.farmerPayment.findUnique({ where: { id: input.paymentId }, include: { farmer: true, procurement: true } });
  if (!pay) throw new NotFoundError("Farmer payment");
  if (!PAYMENT_TRANSITIONS[pay.status].includes(input.status)) throw new AppError(`Cannot change a ${pay.status} payment to ${input.status}.`);

  await db.$transaction(async (tx) => {
    await tx.farmerPayment.update({
      where: { id: pay.id },
      data: {
        status: input.status,
        reference: input.reference ?? pay.reference,
        notes: input.notes ?? pay.notes,
        paymentDate: input.status === "PAID" ? input.paymentDate ?? new Date() : pay.paymentDate,
      },
    });
    const amount = formatINR(pay.totalAmountPaise);
    if (input.status === "PROCESSING") await notifyUser(tx, pay.farmer.userId, msg("notif.paymentProcessing.title"), msg("notif.paymentProcessing.body", { amount }), "/farmer/payments");
    if (input.status === "PAID") await notifyUser(tx, pay.farmer.userId, msg("notif.paymentPaid.title"), msg("notif.paymentPaid.body", { amount, ref: input.reference ?? "" }), "/farmer/payments");
    if (input.status === "FAILED") await notifyUser(tx, pay.farmer.userId, msg("notif.paymentFailed.title"), msg("notif.paymentFailed.body", { amount }), "/farmer/payments");
  });
}

// ───────────── Queries ─────────────

export async function listProcurements() {
  return db.procurement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      farmer: { include: { user: { select: { name: true } } } },
      submission: { select: { id: true, code: true, title: true, quantityGrams: true } },
      farmerPayment: { select: { status: true, totalAmountPaise: true } },
      batch: { select: { batchNumber: true, inventory: { select: { id: true } } } },
    },
  });
}

export async function procurementDetail(id: string) {
  return db.procurement.findUnique({
    where: { id },
    include: {
      farmer: { include: { user: { select: { name: true, phone: true, email: true } } } },
      submission: { include: { physicalTest: { select: { code: true, status: true, testDate: true } } } },
      farmerPayment: true,
      batch: { include: { inventory: true } },
    },
  });
}

export async function listFarmerPayments(farmerId?: string) {
  return db.farmerPayment.findMany({
    where: farmerId ? { farmerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      farmer: { include: { user: { select: { name: true } } } },
      procurement: { select: { code: true, milletType: true, submission: { select: { id: true, title: true, code: true } } } },
    },
  });
}
