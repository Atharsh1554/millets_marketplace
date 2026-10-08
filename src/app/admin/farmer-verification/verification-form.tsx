"use client";

import { useState } from "react";
import { farmerVerificationAction } from "@/app/actions/account";
import { ActionForm, FieldError, SubmitButton } from "@/components/forms";

export function VerificationForm({ farmerId, current }: { farmerId: string; current: string }) {
  const options = (["VERIFIED", "REJECTED", "PENDING"] as const).filter((o) => o !== current);
  const [status, setStatus] = useState<string>(options[0]);
  return (
    <ActionForm action={farmerVerificationAction} className="flex min-w-56 flex-col gap-1.5">
      <input type="hidden" name="farmerId" value={farmerId} />
      <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="input py-1.5 text-xs">
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "VERIFIED" ? "Verify" : o === "REJECTED" ? "Reject" : "Reset to pending"}
          </option>
        ))}
      </select>
      <input name="note" placeholder={status === "REJECTED" ? "Reason (required)" : "Note (optional)"} className="input py-1.5 text-xs" />
      <FieldError name="note" />
      <SubmitButton size="sm" variant={status === "REJECTED" ? "danger" : "primary"}>Save</SubmitButton>
    </ActionForm>
  );
}
