"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import {
  sampleCollectedAction,
  saveChecklistAction,
  scheduleCollectionAction,
  startTestingAction,
  submitTestResultAction,
  uploadTestFilesAction,
} from "@/app/actions/testing";
import { ActionForm, SelectField, SubmitButton, TextArea, TextField } from "@/components/forms";
import { cn } from "@/lib/format";

const today = () => new Date().toISOString().slice(0, 10);

export function ScheduleForm({ testId, defaultLocation }: { testId: string; defaultLocation: string }) {
  return (
    <ActionForm action={scheduleCollectionAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="testId" value={testId} />
      <TextField label="Collection date" name="scheduledDate" type="date" required defaultValue={today()} />
      <TextField label="Collection location" name="collectionLocation" required defaultValue={defaultLocation} />
      <TextArea label="Notes for the team" name="notes" rows={2} className="sm:col-span-2" placeholder="Call farmer the day before…" />
      <div className="sm:col-span-2">
        <SubmitButton>Schedule Collection</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function CollectedForm({ testId }: { testId: string }) {
  return (
    <ActionForm action={sampleCollectedAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="testId" value={testId} />
      <TextField label="Collection date" name="collectionDate" type="date" required defaultValue={today()} />
      <TextField label="Sample quantity (kg)" name="sampleQuantityKg" type="number" step="0.1" min="0.1" required defaultValue="2" inputMode="decimal" />
      <TextArea label="Collection notes" name="notes" rows={2} className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton>Mark Sample Collected</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function StartTestingForm({ testId, code }: { testId: string; code: string }) {
  return (
    <ActionForm action={startTestingAction} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="testId" value={testId} />
      <TextField label="Received date" name="receivedDate" type="date" required defaultValue={today()} />
      <TextField label="Testing location" name="testingLocation" required defaultValue="Quality Centre, Dindigul" />
      <TextField label="Sample batch number" name="batchNumber" required defaultValue={`S-${code}`} />
      <div className="sm:col-span-3">
        <SubmitButton>Start Testing</SubmitButton>
      </div>
    </ActionForm>
  );
}

type Item = { name: string; description: string | null };
type Existing = Record<string, { outcome: string; notes: string | null }>;

const OUTCOMES = [
  { v: "PASS", label: "Pass", cls: "peer-checked:bg-leaf-600 peer-checked:text-white peer-checked:ring-leaf-600" },
  { v: "FAIL", label: "Fail", cls: "peer-checked:bg-red-600 peer-checked:text-white peer-checked:ring-red-600" },
  { v: "REQUIRES_REVIEW", label: "Review", cls: "peer-checked:bg-millet-400 peer-checked:text-earth-900 peer-checked:ring-millet-400" },
];

/** Configurable physical-testing checklist: PASS / FAIL / REQUIRES REVIEW + notes per item. */
export function ChecklistForm({ testId, items, existing, testingNotes, editable }: { testId: string; items: Item[]; existing: Existing; testingNotes: string; editable: boolean }) {
  return (
    <ActionForm action={saveChecklistAction} className="space-y-3">
      <input type="hidden" name="testId" value={testId} />
      {items.map((item) => (
        <fieldset key={item.name} disabled={!editable} className="rounded-2xl border border-earth-100 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-semibold text-earth-900">
              {item.name}
              {item.description && <span className="block text-xs font-normal text-muted">{item.description}</span>}
            </legend>
            <div className="flex gap-1.5">
              {OUTCOMES.map((o) => (
                <label key={o.v} className="cursor-pointer">
                  <input type="radio" name={`outcome__${item.name}`} value={o.v} defaultChecked={existing[item.name]?.outcome === o.v} className="peer sr-only" />
                  <span className={cn("block rounded-lg bg-cream px-3 py-1.5 text-xs font-bold text-earth-700 ring-1 ring-earth-100 transition peer-focus-visible:ring-2", o.cls)}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <input name={`notes__${item.name}`} defaultValue={existing[item.name]?.notes ?? ""} placeholder="Notes (optional)" className="input mt-2 py-2 text-sm" />
        </fieldset>
      ))}
      <TextArea label="Overall testing notes" name="testingNotes" defaultValue={testingNotes} rows={3} disabled={!editable} />
      {editable && <SubmitButton variant="outline">Save checklist</SubmitButton>}
    </ActionForm>
  );
}

export function AttachmentForm({ testId }: { testId: string }) {
  return (
    <ActionForm action={uploadTestFilesAction} resetOnSuccess className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <input type="hidden" name="testId" value={testId} />
      <SelectField
        label="Type"
        name="kind"
        options={[
          ["TEST_PHOTO", "Test photo"],
          ["SAMPLE_PHOTO", "Sample photo"],
          ["DOCUMENT", "Document (PDF)"],
          ["TEST_REPORT", "Test report (PDF)"],
        ]}
      />
      <div>
        <label className="label" htmlFor="files">Files</label>
        <input id="files" name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" required className="input py-2" />
      </div>
      <SubmitButton variant="outline">Upload</SubmitButton>
    </ActionForm>
  );
}

type Result = "PASSED" | "FAILED" | "ADDITIONAL_TESTING_REQUIRED";

export function ResultForm({ testId, initial }: { testId: string; initial?: string }) {
  const [result, setResult] = useState<Result>(initial === "FAILED" || initial === "ADDITIONAL_TESTING_REQUIRED" ? initial : "PASSED");
  const opts = [
    { v: "PASSED" as const, label: "Physical Test Passed", icon: CheckCircle2, cls: "border-leaf-600 bg-leaf-50 text-leaf-800" },
    { v: "FAILED" as const, label: "Physical Test Failed", icon: XCircle, cls: "border-red-500 bg-red-50 text-red-700" },
    { v: "ADDITIONAL_TESTING_REQUIRED" as const, label: "Additional Testing Required", icon: RotateCcw, cls: "border-millet-400 bg-millet-50 text-millet-700" },
  ];
  return (
    <ActionForm action={submitTestResultAction} className="space-y-4" confirm="Submit this physical test result? The farmer and admin will be notified.">
      <input type="hidden" name="testId" value={testId} />
      <input type="hidden" name="result" value={result} />
      <div className="grid gap-2 sm:grid-cols-3">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setResult(o.v)}
            aria-pressed={result === o.v}
            className={cn("flex items-center gap-2 rounded-2xl border-2 p-3 text-left text-sm font-semibold transition", result === o.v ? o.cls : "border-earth-100 bg-white text-earth-700")}
          >
            <o.icon className="size-5 shrink-0" /> {o.label}
          </button>
        ))}
      </div>
      <TextArea
        label={result === "PASSED" ? "Notes (optional)" : "Reason (shown to the farmer)"}
        name="reason"
        rows={3}
        required={result !== "PASSED"}
        placeholder={result === "FAILED" ? "e.g. High moisture and visible fungal spots" : undefined}
      />
      <SubmitButton variant={result === "FAILED" ? "danger" : "primary"}>Submit result</SubmitButton>
    </ActionForm>
  );
}
