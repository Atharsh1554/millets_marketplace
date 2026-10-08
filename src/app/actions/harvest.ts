"use server";

import type { MediaKind } from "@prisma/client";
import { msg } from "@/i18n/translate";
import type { FormResult } from "@/components/forms";
import { requireActor } from "@/server/auth/guard";
import { withAudit } from "@/server/run-action";
import { createSubmission, reviewSubmission, updateSubmission, type MediaUpload } from "@/server/services/harvest";
import { filesFrom } from "@/server/storage";
import { formToObject } from "@/server/validation";

const KINDS: MediaKind[] = ["HARVEST", "GRAIN", "FARM", "PACKAGE", "VIDEO"];

export async function submitHarvestAction(_: FormResult, form: FormData): Promise<FormResult> {
  return withAudit("submitHarvestAction", form, async () => {
    const actor = await requireActor(["FARMER"]);
    const data = formToObject(form);
    const media: MediaUpload[] = KINDS.flatMap((kind) => filesFrom(form, `media_${kind}`).map((file) => ({ kind, file })));
    const asDraft = data.intent === "draft";
    const sub = data.submissionId
      ? await updateSubmission(actor, data.submissionId, data, media, { asDraft })
      : await createSubmission(actor, data, media, { asDraft });
    return {
      redirectTo: `/farmer/harvests/${sub.id}${asDraft ? "" : "?submitted=1"}`,
      message: asDraft ? msg("success.draftSaved") : msg("success.harvestSubmitted"),
    };
  });
}

export async function reviewSubmissionAction(_: FormResult, form: FormData): Promise<FormResult> {
  return withAudit("reviewSubmissionAction", form, async () => {
    const actor = await requireActor(["ADMIN"]);
    const data = formToObject(form);
    await reviewSubmission(actor, data);
    const msg = { APPROVED: "Approved — sent to the quality team for physical testing.", REJECTED: "Submission rejected. The farmer has been notified.", MORE_INFO_REQUESTED: "Request sent to the farmer." };
    return { message: msg[data.decision as keyof typeof msg] };
  });
}
