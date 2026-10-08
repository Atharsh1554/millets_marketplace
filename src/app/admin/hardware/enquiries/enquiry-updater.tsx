"use client";

import { updateHardwareEnquiryAction } from "@/app/actions/hardware";
import { ActionForm, SubmitButton } from "@/components/forms";

const OPTIONS: Array<[string, string]> = [
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["IN_DISCUSSION", "In Discussion"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

export function EnquiryUpdater({ enquiryId, current, note }: { enquiryId: string; current: string; note: string }) {
  return (
    <ActionForm action={updateHardwareEnquiryAction} className="flex min-w-52 flex-col gap-1.5">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <select name="status" defaultValue={current} className="input py-1.5 text-xs">
        {OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <input name="adminNote" defaultValue={note} placeholder="Note to farmer (optional)" className="input py-1.5 text-xs" />
      <SubmitButton size="sm">Update</SubmitButton>
    </ActionForm>
  );
}
