import type { AttachmentKind, PhysicalTestStatus } from "@prisma/client";
import { msg } from "@/i18n/translate";
import { db } from "@/server/db";
import { AppError, NotFoundError } from "@/server/errors";
import { getStorage, validateUpload } from "@/server/storage";
import {
  checklistItemSchema,
  checklistSchema,
  sampleCollectedSchema,
  scheduleCollectionSchema,
  startTestingSchema,
  testResultSchema,
} from "@/server/validation";
import { codes } from "./codes";
import { setHarvestStatus } from "./harvest";
import { notifyRole, notifyUser } from "./notifications";
import { assertRole, type Actor } from "./types";
import { kgToGrams } from "@/lib/format";

/**
 * DIRECT PHYSICAL TESTING — the only quality-testing stage.
 * Performed in person by our quality team (visual / physical checks). Not a laboratory certification.
 */
const STAFF = ["QUALITY_TEAM", "ADMIN"] as const;

async function loadTest(testId: string) {
  const test = await db.physicalTest.findUnique({
    where: { id: testId },
    include: { submission: { include: { farmer: true } }, collection: true, results: true },
  });
  if (!test) throw new NotFoundError("Physical test");
  return test;
}

function expect(status: PhysicalTestStatus, allowed: PhysicalTestStatus[], action: string) {
  if (!allowed.includes(status)) throw new AppError(`Cannot ${action} while the test is "${status.replaceAll("_", " ").toLowerCase()}".`);
}

export async function scheduleCollection(actor: Actor, raw: unknown) {
  assertRole(actor, [...STAFF]);
  const input = scheduleCollectionSchema.parse(raw);
  const test = await loadTest(input.testId);
  expect(test.status, ["PENDING", "COLLECTION_SCHEDULED"], "schedule collection");

  await db.$transaction(async (tx) => {
    await tx.sampleCollection.upsert({
      where: { physicalTestId: test.id },
      create: { physicalTestId: test.id, scheduledDate: input.scheduledDate, collectionLocation: input.collectionLocation, notes: input.notes },
      update: { scheduledDate: input.scheduledDate, collectionLocation: input.collectionLocation, notes: input.notes, status: "SCHEDULED" },
    });
    await tx.physicalTest.update({ where: { id: test.id }, data: { status: "COLLECTION_SCHEDULED" } });
    await setHarvestStatus(tx, test.submissionId, "SAMPLE_COLLECTION_SCHEDULED", msg("events.collectionScheduled", { date: input.scheduledDate.toISOString().slice(0, 10), location: input.collectionLocation }), actor.id);
    await notifyUser(
      tx,
      test.submission.farmer.userId,
      msg("notif.sampleScheduled.title"),
      msg("notif.sampleScheduled.body", { date: input.scheduledDate.toISOString().slice(0, 10), location: input.collectionLocation }),
      `/farmer/harvests/${test.submissionId}`,
    );
    await notifyRole(tx, ["QUALITY_TEAM"], "Sample collection scheduled", `${test.code} · ${test.submission.title} on ${input.scheduledDate.toDateString()}.`, `/quality/tests/${test.id}`);
  });
}

export async function markSampleCollected(actor: Actor, raw: unknown) {
  assertRole(actor, [...STAFF]);
  const input = sampleCollectedSchema.parse(raw);
  const test = await loadTest(input.testId);
  expect(test.status, ["COLLECTION_SCHEDULED"], "mark the sample collected");
  const grams = kgToGrams(input.sampleQuantityKg);
  if (grams > test.submission.quantityGrams) throw new AppError("Sample quantity cannot exceed the submitted harvest quantity.");

  await db.$transaction(async (tx) => {
    await tx.sampleCollection.update({
      where: { physicalTestId: test.id },
      data: { status: "COLLECTED", collectionDate: input.collectionDate, collectedById: actor.id, sampleQuantityGrams: grams, notes: input.notes ?? test.collection?.notes },
    });
    await tx.physicalTest.update({ where: { id: test.id }, data: { status: "SAMPLE_COLLECTED", sampleQuantityGrams: grams } });
    await setHarvestStatus(tx, test.submissionId, "SAMPLE_COLLECTED", msg("events.sampleCollected", { name: actor.name }), actor.id);
    await notifyRole(tx, ["QUALITY_TEAM"], "Testing pending", `${test.code} sample collected — testing pending.`, `/quality/tests/${test.id}`);
  });
}

export async function startTesting(actor: Actor, raw: unknown) {
  assertRole(actor, [...STAFF]);
  const input = startTestingSchema.parse(raw);
  const test = await loadTest(input.testId);
  expect(test.status, ["SAMPLE_COLLECTED", "ADDITIONAL_TESTING_REQUIRED"], "start testing");

  await db.$transaction(async (tx) => {
    await tx.sampleCollection.update({ where: { physicalTestId: test.id }, data: { status: "RECEIVED" } });
    await tx.physicalTest.update({
      where: { id: test.id },
      data: {
        status: "TESTING",
        receivedDate: input.receivedDate,
        testingLocation: input.testingLocation,
        batchNumber: input.batchNumber,
        testStartedAt: new Date(),
        testedById: actor.id,
        result: null,
      },
    });
    if (test.status === "SAMPLE_COLLECTED") {
      await setHarvestStatus(tx, test.submissionId, "PHYSICAL_TESTING", msg("events.testingStarted", { location: input.testingLocation }), actor.id);
    } else {
      await tx.harvestStatusEvent.create({ data: { submissionId: test.submissionId, status: "PHYSICAL_TESTING", note: msg("events.additionalStarted"), actorId: actor.id } });
    }
    await notifyRole(tx, ["QUALITY_TEAM"], "Testing result required", `${test.code} is in testing — record checklist results.`, `/quality/tests/${test.id}`);
  });
}

export async function saveChecklist(actor: Actor, raw: unknown) {
  assertRole(actor, [...STAFF]);
  const input = checklistSchema.parse(raw);
  const test = await loadTest(input.testId);
  expect(test.status, ["TESTING"], "record checklist results");

  await db.$transaction(async (tx) => {
    for (const r of input.results) {
      await tx.physicalTestResult.upsert({
        where: { physicalTestId_parameter: { physicalTestId: test.id, parameter: r.parameter } },
        create: { physicalTestId: test.id, parameter: r.parameter, outcome: r.outcome, notes: r.notes },
        update: { outcome: r.outcome, notes: r.notes ?? null },
      });
    }
    await tx.physicalTest.update({ where: { id: test.id }, data: { testingNotes: input.testingNotes ?? null } });
  });
}

export async function addTestAttachments(actor: Actor, testId: string, files: Array<{ kind: AttachmentKind; file: File }>) {
  assertRole(actor, [...STAFF]);
  const test = await loadTest(testId);
  expect(test.status, ["SAMPLE_COLLECTED", "TESTING", "ADDITIONAL_TESTING_REQUIRED"], "upload test files");
  if (files.length === 0) throw new AppError("Choose at least one file.");
  if (files.length > 10) throw new AppError("Upload at most 10 files at a time.");
  const validated = await Promise.all(
    files.map(async (f) => ({ kind: f.kind, name: f.file.name, ...(await validateUpload(f.file, ["image", "document"])) })),
  );
  const storage = getStorage();
  for (const v of validated) {
    const { url } = await storage.save(v, "tests");
    await db.testAttachment.create({
      data: { physicalTestId: test.id, kind: v.kind, url, fileName: v.name.slice(0, 120), mimeType: v.mimeType, sizeBytes: v.bytes.length },
    });
  }
}

/**
 * Final physical test result.
 * PASSED requires every active checklist item to be recorded and none to be FAIL or REQUIRES_REVIEW.
 */
export async function submitTestResult(actor: Actor, raw: unknown) {
  assertRole(actor, [...STAFF]);
  const input = testResultSchema.parse(raw);
  const test = await loadTest(input.testId);
  expect(test.status, ["TESTING"], "submit a result");

  if (input.result === "PASSED") {
    const active = await db.testChecklistItem.findMany({ where: { active: true } });
    const recorded = new Map(test.results.map((r) => [r.parameter, r.outcome]));
    const missing = active.filter((a) => !recorded.has(a.name)).map((a) => a.name);
    if (missing.length) throw new AppError(`Record every checklist item before passing. Missing: ${missing.join(", ")}.`);
    const blocking = test.results.filter((r) => r.outcome !== "PASS").map((r) => r.parameter);
    if (blocking.length) throw new AppError(`Cannot pass while these checks are not PASS: ${blocking.join(", ")}.`);
  }

  const farmerUserId = test.submission.farmer.userId;
  const link = `/farmer/harvests/${test.submissionId}`;

  await db.$transaction(async (tx) => {
    await tx.physicalTest.update({
      where: { id: test.id },
      data: { status: input.result, result: input.result, resultReason: input.reason ?? null, testDate: new Date(), testedById: actor.id },
    });
    await notifyRole(tx, ["ADMIN"], "Testing result submitted", `${test.code} · ${test.submission.title}: ${input.result.replaceAll("_", " ")}.`, `/admin/quality/tests/${test.id}`);

    if (input.result === "PASSED") {
      await setHarvestStatus(tx, test.submissionId, "PHYSICAL_TEST_PASSED", msg("events.passed"), actor.id);
      const code = await codes.procurement(tx);
      await tx.procurement.create({
        data: {
          code,
          submissionId: test.submissionId,
          farmerId: test.submission.farmerId,
          milletType: test.submission.milletType,
          approvedQuantityGrams: test.submission.quantityGrams,
          agreedPricePerKgPaise: test.submission.expectedPricePerKgPaise,
        },
      });
      await setHarvestStatus(tx, test.submissionId, "PROCUREMENT_PENDING", msg("events.approvedProcurement"), null);
      await notifyUser(tx, farmerUserId, msg("notif.testPassed.title"), msg("notif.testPassed.body"), link);
      await notifyRole(tx, ["ADMIN"], "Harvest ready for procurement", `${code} · ${test.submission.title} is ready for procurement.`, `/admin/procurement`);
    } else if (input.result === "FAILED") {
      await setHarvestStatus(tx, test.submissionId, "PHYSICAL_TEST_FAILED", msg("events.failed", { reason: input.reason ?? "" }), actor.id);
      await notifyUser(tx, farmerUserId, msg("notif.testFailed.title"), msg("notif.testFailed.body", { reason: input.reason ?? "" }), link);
    } else {
      await tx.harvestStatusEvent.create({
        data: { submissionId: test.submissionId, status: "PHYSICAL_TESTING", note: msg("events.additionalRequired", { reason: input.reason ?? "" }), actorId: actor.id },
      });
    }
  });
}

// ───────────── Checklist configuration (admin) ─────────────

export async function addChecklistItem(actor: Actor, raw: unknown) {
  assertRole(actor, ["ADMIN"]);
  const input = checklistItemSchema.parse(raw);
  const exists = await db.testChecklistItem.findUnique({ where: { name: input.name } });
  if (exists) throw new AppError("A checklist item with this name already exists.");
  await db.testChecklistItem.create({ data: input });
}

export async function toggleChecklistItem(actor: Actor, id: string) {
  assertRole(actor, ["ADMIN"]);
  const item = await db.testChecklistItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("Checklist item");
  await db.testChecklistItem.update({ where: { id }, data: { active: !item.active } });
}

// ───────────── Queries ─────────────

export async function listTests(filter?: { status?: PhysicalTestStatus }) {
  return db.physicalTest.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      submission: { select: { id: true, code: true, title: true, milletType: true, quantityGrams: true, village: true, district: true, contactName: true } },
      collection: true,
    },
  });
}

export async function testDetail(id: string) {
  return db.physicalTest.findUnique({
    where: { id },
    include: {
      submission: { include: { media: true, farmer: { include: { user: { select: { name: true, phone: true, email: true } } } } } },
      collection: { include: { collectedBy: { select: { name: true } } } },
      results: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "asc" } },
      testedBy: { select: { name: true } },
    },
  });
}

export async function activeChecklist() {
  return db.testChecklistItem.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}
