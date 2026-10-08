"use client";

import { useState } from "react";
import { updateComplaintAction } from "@/app/actions/account";
import { ActionForm, FieldError, SubmitButton } from "@/components/forms";

export function ComplaintUpdater({ complaintId, current }: { complaintId: string; current: string }) {
  const options = (["IN_PROGRESS", "RESOLVED", "CLOSED"] as const).filter((o) => o !== current);
  const [status, setStatus] = useState<string>(options[0]);
  const needsReply = status === "RESOLVED" || status === "CLOSED";
  return (
    <ActionForm action={updateComplaintAction} className="flex flex-col gap-2">
      <input type="hidden" name="complaintId" value={complaintId} />
      <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="input py-2 text-sm">
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "IN_PROGRESS" ? "Mark in progress" : o === "RESOLVED" ? "Mark resolved" : "Close"}
          </option>
        ))}
      </select>
      <textarea name="resolution" rows={2} required={needsReply} placeholder={needsReply ? "Resolution sent to the customer (required)" : "Note to the customer (optional)"} className="input text-sm" />
      <FieldError name="resolution" />
      <SubmitButton size="sm">Update complaint</SubmitButton>
    </ActionForm>
  );
}
