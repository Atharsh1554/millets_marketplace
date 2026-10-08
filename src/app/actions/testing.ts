"use server";

import type { AttachmentKind } from "@prisma/client";
import type { FormResult } from "@/components/forms";
import { requireActor } from "@/server/auth/guard";
import { withAudit } from "@/server/run-action";
import {
  addChecklistItem,
  addTestAttachments,
  markSampleCollected,
  saveChecklist,
  scheduleCollection,
  startTesting,
  submitTestResult,
  toggleChecklistItem,
} from "@/server/services/testing";
import { filesFrom } from "@/server/storage";
import { formToObject } from "@/server/validation";

const STAFF = ["QUALITY_TEAM", "ADMIN"] as const;

export async function scheduleCollectionAction(_: FormResult, form: FormData) {
  return withAudit("scheduleCollectionAction", form, async () => scheduleCollection(await requireActor([...STAFF]), formToObject(form)), "Collection scheduled. The farmer has been notified.");
}

export async function sampleCollectedAction(_: FormResult, form: FormData) {
  return withAudit("sampleCollectedAction", form, async () => markSampleCollected(await requireActor([...STAFF]), formToObject(form)), "Sample marked as collected.");
}

export async function startTestingAction(_: FormResult, form: FormData) {
  return withAudit("startTestingAction", form, async () => startTesting(await requireActor([...STAFF]), formToObject(form)), "Testing started.");
}

/** Checklist form posts `outcome__<parameter>` and `notes__<parameter>` pairs. */
export async function saveChecklistAction(_: FormResult, form: FormData) {
  return withAudit("saveChecklistAction", form, async () => {
    const actor = await requireActor([...STAFF]);
    const data = formToObject(form);
    const results = Object.keys(data)
      .filter((k) => k.startsWith("outcome__") && data[k])
      .map((k) => {
        const parameter = k.slice("outcome__".length);
        return { parameter, outcome: data[k], notes: data[`notes__${parameter}`] || undefined };
      });
    await saveChecklist(actor, { testId: data.testId, testingNotes: data.testingNotes, results });
  }, "Checklist saved.");
}

export async function uploadTestFilesAction(_: FormResult, form: FormData) {
  return withAudit("uploadTestFilesAction", form, async () => {
    const actor = await requireActor([...STAFF]);
    const kind = (form.get("kind") as AttachmentKind) || "TEST_PHOTO";
    if (!["TEST_PHOTO", "SAMPLE_PHOTO", "DOCUMENT", "TEST_REPORT"].includes(kind)) throw new Error("Invalid kind");
    await addTestAttachments(actor, String(form.get("testId")), filesFrom(form, "files").map((file) => ({ kind, file })));
  }, "Files uploaded.");
}

export async function submitTestResultAction(_: FormResult, form: FormData) {
  return withAudit("submitTestResultAction", form, async () => {
    const data = formToObject(form);
    await submitTestResult(await requireActor([...STAFF]), data);
    return {
      message:
        data.result === "PASSED"
          ? "Physical test passed — harvest approved for procurement."
          : data.result === "FAILED"
            ? "Physical test failed. The farmer has been notified."
            : "Marked as requiring additional testing.",
    };
  });
}

export async function addChecklistItemAction(_: FormResult, form: FormData) {
  return withAudit("addChecklistItemAction", form, async () => addChecklistItem(await requireActor(["ADMIN"]), formToObject(form)), "Checklist item added.");
}

export async function toggleChecklistItemAction(_: FormResult, form: FormData) {
  return withAudit("toggleChecklistItemAction", form, async () => toggleChecklistItem(await requireActor(["ADMIN"]), String(form.get("id"))));
}
