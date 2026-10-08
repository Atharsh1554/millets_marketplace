import type { HarvestStatus, MediaKind } from "@prisma/client";
import { msg } from "@/i18n/translate";
import { db, type Tx } from "@/server/db";
import { AppError, ForbiddenError, NotFoundError } from "@/server/errors";
import { getStorage, validateUpload, UPLOAD_LIMITS } from "@/server/storage";
import { adminReviewSchema, harvestSchema, type HarvestInput } from "@/server/validation";
import { codes } from "./codes";
import { notifyRole, notifyUser } from "./notifications";
import { assertRole, type Actor } from "./types";
import { kgToGrams, rupeesToPaise } from "@/lib/format";

/** Records a status change on the submission plus an audit event for the timeline. */
export async function setHarvestStatus(tx: Tx, submissionId: string, status: HarvestStatus, note: string | null, actorId: string | null) {
  await tx.harvestSubmission.update({ where: { id: submissionId }, data: { status } });
  await tx.harvestStatusEvent.create({ data: { submissionId, status, note, actorId } });
}

export type MediaUpload = { kind: MediaKind; file: File };

async function storeMedia(uploads: MediaUpload[]) {
  const images = uploads.filter((u) => u.kind !== "VIDEO");
  const videos = uploads.filter((u) => u.kind === "VIDEO");
  if (images.length > UPLOAD_LIMITS.maxImagesPerSubmission) throw new AppError(msg("errors.tooManyPhotos", { max: UPLOAD_LIMITS.maxImagesPerSubmission }));
  if (videos.length > 1) throw new AppError(msg("errors.oneVideo"));

  // Validate everything before writing anything.
  const validated = await Promise.all(
    uploads.map(async (u) => ({ kind: u.kind, ...(await validateUpload(u.file, u.kind === "VIDEO" ? ["video"] : ["image"])) })),
  );
  const storage = getStorage();
  const stored = [];
  for (const v of validated) {
    const { url } = await storage.save(v, "harvests");
    stored.push({ kind: v.kind, url, mimeType: v.mimeType, sizeBytes: v.bytes.length });
  }
  return stored;
}

function toData(input: HarvestInput) {
  return {
    title: input.title,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    contactEmail: input.contactEmail ?? null,
    village: input.village,
    district: input.district,
    state: input.state,
    farmLocation: input.farmLocation ?? null,
    milletType: input.milletType,
    harvestDate: input.harvestDate,
    quantityGrams: kgToGrams(input.quantityKg),
    expectedPricePerKgPaise: rupeesToPaise(input.expectedPricePerKg),
    cultivationMethod: input.cultivationMethod,
    processingMethod: input.processingMethod,
    storageMethod: input.storageMethod,
    description: input.description,
    notes: input.notes ?? null,
  };
}

async function announceSubmitted(tx: Tx, submissionId: string, code: string, title: string, farmerUserId: string, actorId: string) {
  await setHarvestStatus(tx, submissionId, "SUBMITTED", msg("events.submitted"), actorId);
  await tx.harvestSubmission.update({ where: { id: submissionId }, data: { submittedAt: new Date(), infoRequested: false } });
  await setHarvestStatus(tx, submissionId, "ADMIN_REVIEW_PENDING", null, null);
  await notifyUser(tx, farmerUserId, msg("notif.harvestSubmitted.title"), msg("notif.harvestSubmitted.body", { code, title }), `/farmer/harvests/${submissionId}`);
  await notifyRole(tx, ["ADMIN"], "New farmer harvest submitted", `${code} · ${title} is waiting for review.`, `/admin/submissions/${submissionId}`);
}

/** Farmer creates a submission (optionally as a draft). */
export async function createSubmission(actor: Actor, raw: unknown, media: MediaUpload[], opts: { asDraft: boolean }) {
  assertRole(actor, ["FARMER"]);
  if (!actor.farmerId) throw new AppError(msg("errors.completeFarmerProfile"));
  const input = harvestSchema.parse(raw);
  const stored = await storeMedia(media);
  if (!opts.asDraft && stored.filter((s) => s.kind !== "VIDEO").length === 0) {
    throw new AppError(msg("errors.photoRequired"));
  }

  return db.$transaction(async (tx) => {
    const code = await codes.harvest(tx);
    const sub = await tx.harvestSubmission.create({
      data: { ...toData(input), code, farmerId: actor.farmerId!, status: "DRAFT", media: { create: stored } },
    });
    await tx.harvestStatusEvent.create({ data: { submissionId: sub.id, status: "DRAFT", note: msg("events.draft"), actorId: actor.id } });
    if (!opts.asDraft) await announceSubmitted(tx, sub.id, code, sub.title, actor.id, actor.id);
    return sub;
  });
}

/** Farmer edits a draft, or a submission where the admin requested more information, and (re)submits it. */
export async function updateSubmission(actor: Actor, submissionId: string, raw: unknown, media: MediaUpload[], opts: { asDraft: boolean }) {
  assertRole(actor, ["FARMER"]);
  const sub = await db.harvestSubmission.findUnique({ where: { id: submissionId }, include: { media: true } });
  if (!sub) throw new NotFoundError("Submission");
  if (sub.farmerId !== actor.farmerId) throw new ForbiddenError();
  const editable = sub.status === "DRAFT" || (sub.status === "ADMIN_REVIEW_PENDING" && sub.infoRequested);
  if (!editable) throw new AppError(msg("errors.submissionLocked"));
  const input = harvestSchema.parse(raw);
  const stored = await storeMedia(media);
  const photoCount = sub.media.filter((m) => m.kind !== "VIDEO").length + stored.filter((s) => s.kind !== "VIDEO").length;
  if (!opts.asDraft && photoCount === 0) throw new AppError(msg("errors.photoRequired"));

  return db.$transaction(async (tx) => {
    await tx.harvestSubmission.update({ where: { id: sub.id }, data: { ...toData(input), media: { create: stored } } });
    if (opts.asDraft) return sub;
    if (sub.status === "DRAFT") {
      await announceSubmitted(tx, sub.id, sub.code, input.title, actor.id, actor.id);
    } else {
      await tx.harvestSubmission.update({ where: { id: sub.id }, data: { infoRequested: false } });
      await tx.harvestStatusEvent.create({ data: { submissionId: sub.id, status: "ADMIN_REVIEW_PENDING", note: msg("events.infoProvided"), actorId: actor.id } });
      await notifyRole(tx, ["ADMIN"], "Harvest waiting for review", `${sub.code} was updated with the information you requested.`, `/admin/submissions/${sub.id}`);
    }
    return sub;
  });
}

/**
 * ONLINE ADMIN REVIEW — checks the farmer's submission details only.
 * This is NOT the quality test; approval sends the harvest to direct physical testing.
 */
export async function reviewSubmission(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = adminReviewSchema.parse(raw);
  const sub = await db.harvestSubmission.findUnique({ where: { id: input.submissionId }, include: { farmer: true } });
  if (!sub) throw new NotFoundError("Submission");
  if (sub.status !== "ADMIN_REVIEW_PENDING") throw new AppError("Only submissions pending admin review can be reviewed.");

  return db.$transaction(async (tx) => {
    await tx.adminReview.create({
      data: {
        submissionId: sub.id,
        reviewerId: actor.id,
        decision: input.decision,
        adminNotes: input.adminNotes,
        comments: input.comments,
        requestedChanges: input.requestedChanges,
      },
    });
    const farmerUserId = sub.farmer.userId;
    const link = `/farmer/harvests/${sub.id}`;

    if (input.decision === "APPROVED") {
      await setHarvestStatus(tx, sub.id, "ADMIN_APPROVED", input.comments ?? msg("events.accepted"), actor.id);
      const testCode = await codes.test(tx);
      const test = await tx.physicalTest.create({ data: { code: testCode, submissionId: sub.id, status: "PENDING" } });
      await setHarvestStatus(tx, sub.id, "PHYSICAL_TESTING_PENDING", msg("events.awaitingTesting"), null);
      await notifyUser(tx, farmerUserId, msg("notif.accepted.title"), msg("notif.accepted.body"), link);
      const staffMsg = `${testCode} · ${sub.title} (${sub.village}, ${sub.district}) — physical testing required.`;
      await notifyRole(tx, ["QUALITY_TEAM"], "New physical testing request", staffMsg, `/quality/tests/${test.id}`);
      await notifyRole(tx, ["ADMIN"], "Physical testing required", staffMsg, `/admin/quality/tests/${test.id}`);
    } else if (input.decision === "REJECTED") {
      await setHarvestStatus(tx, sub.id, "ADMIN_REJECTED", input.comments ?? null, actor.id);
      await notifyUser(tx, farmerUserId, msg("notif.rejected.title"), msg("notif.rejected.body", { code: sub.code, reason: input.comments ?? "" }), link);
    } else {
      await tx.harvestSubmission.update({ where: { id: sub.id }, data: { infoRequested: true } });
      await tx.harvestStatusEvent.create({
        data: { submissionId: sub.id, status: "ADMIN_REVIEW_PENDING", note: msg("events.infoRequested", { details: input.requestedChanges ?? "" }), actorId: actor.id },
      });
      await notifyUser(tx, farmerUserId, msg("notif.moreInfo.title"), msg("notif.moreInfo.body", { code: sub.code, details: input.requestedChanges ?? "" }), link);
    }
  });
}

// ───────────── Queries ─────────────

export async function farmerSubmissions(farmerId: string) {
  return db.harvestSubmission.findMany({
    where: { farmerId },
    orderBy: { createdAt: "desc" },
    include: {
      physicalTest: { select: { status: true } },
      procurement: { select: { status: true, actualQuantityGrams: true, farmerPayment: { select: { status: true, totalAmountPaise: true } } } },
    },
  });
}

export async function submissionDetail(id: string) {
  return db.harvestSubmission.findUnique({
    where: { id },
    include: {
      farmer: { include: { user: { select: { name: true, email: true, phone: true, createdAt: true } } } },
      media: { orderBy: { createdAt: "asc" } },
      adminReviews: { orderBy: { createdAt: "desc" }, include: { reviewer: { select: { name: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      physicalTest: { include: { collection: { include: { collectedBy: { select: { name: true } } } }, results: true, attachments: true, testedBy: { select: { name: true } } } },
      procurement: { include: { farmerPayment: true, batch: { include: { inventory: { include: { products: { select: { id: true, slug: true, name: true, status: true } } } } } } } },
    },
  });
}
