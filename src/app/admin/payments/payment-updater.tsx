"use client";

import { useState } from "react";
import { farmerPaymentAction } from "@/app/actions/operations";
import { ActionForm, FieldError, SubmitButton } from "@/components/forms";

const NEXT: Record<string, Array<[string, string]>> = {
  PENDING: [["PROCESSING", "Mark processing"], ["PAID", "Mark paid"], ["FAILED", "Mark failed"]],
  PROCESSING: [["PAID", "Mark paid"], ["FAILED", "Mark failed"]],
  FAILED: [["PROCESSING", "Retry (processing)"], ["PAID", "Mark paid"]],
};

/** Record Farmer Payment: status + UTR/transaction reference. */
export function PaymentUpdater({ paymentId, status }: { paymentId: string; status: string }) {
  const options = NEXT[status] ?? [];
  const [next, setNext] = useState(options[0]?.[0] ?? "");
  return (
    <ActionForm action={farmerPaymentAction} className="flex min-w-64 flex-col gap-1.5">
      <input type="hidden" name="paymentId" value={paymentId} />
      <select name="status" value={next} onChange={(e) => setNext(e.target.value)} className="input py-1.5 text-xs">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {next === "PAID" && (
        <>
          <input name="reference" placeholder="UTR / transaction ref" className="input py-1.5 text-xs" required />
          <FieldError name="reference" />
          <input name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input py-1.5 text-xs" />
        </>
      )}
      <SubmitButton size="sm">Update</SubmitButton>
    </ActionForm>
  );
}
