"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { reviewSubmissionAction } from "@/app/actions/harvest";
import { ActionForm, SubmitButton, TextArea } from "@/components/forms";
import { cn } from "@/lib/format";

export function ReviewForm({ submissionId }: { submissionId: string }) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "MORE_INFO_REQUESTED">("APPROVED");
  const opts = [
    { v: "APPROVED" as const, label: "Accept for Physical Testing", icon: CheckCircle2, cls: "border-leaf-600 bg-leaf-50 text-leaf-800" },
    { v: "REJECTED" as const, label: "Reject Submission", icon: XCircle, cls: "border-red-500 bg-red-50 text-red-700" },
    { v: "MORE_INFO_REQUESTED" as const, label: "Request More Information", icon: RefreshCw, cls: "border-millet-400 bg-millet-50 text-millet-700" },
  ];
  return (
    <ActionForm action={reviewSubmissionAction} className="space-y-4">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="grid gap-2">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={decision === o.v}
            onClick={() => setDecision(o.v)}
            className={cn("flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm font-semibold transition", decision === o.v ? o.cls : "border-earth-100 bg-white text-earth-700")}
          >
            <o.icon className="size-5" /> {o.label}
          </button>
        ))}
      </div>
      {decision === "MORE_INFO_REQUESTED" && <TextArea label="Requested changes (sent to farmer)" name="requestedChanges" required rows={3} />}
      <TextArea label={decision === "REJECTED" ? "Reason (sent to farmer)" : "Comments to farmer (optional)"} name="comments" required={decision === "REJECTED"} rows={3} />
      <TextArea label="Internal admin notes" name="adminNotes" rows={2} hint="Not visible to the farmer." />
      <p className="text-xs text-muted">This is an online review of the submission only. Approval does not mean the harvest has passed quality testing.</p>
      <SubmitButton variant={decision === "REJECTED" ? "danger" : "primary"} className="w-full">
        {decision === "APPROVED" ? "Approve for Physical Testing" : decision === "REJECTED" ? "Reject Submission" : "Send request to farmer"}
      </SubmitButton>
    </ActionForm>
  );
}
