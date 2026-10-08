import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, ClipboardCheck, FileText, FlaskConical, Info, PackageCheck, Paperclip, Phone, Trophy } from "lucide-react";
import { Card, CardHeader, DetailList, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { Timeline } from "@/components/timeline";
import { MediaGallery } from "@/components/media-gallery";
import { activeChecklist, testDetail } from "@/server/services/testing";
import { formatDate, formatDateTime, formatINR, formatKg } from "@/lib/format";
import { ATTACHMENT_KIND_LABEL, MILLET_LABEL, TEST_STATUS } from "@/lib/labels";
import { AttachmentForm, ChecklistForm, CollectedForm, ResultForm, ScheduleForm, StartTestingForm } from "./test-forms";

/** Inspection workspace — shared by the quality team (/quality) and admin quality management (/admin/quality). */
export async function TestWorkspace({ id, basePath, decision }: { id: string; basePath: string; decision?: string }) {
  const [test, checklist] = await Promise.all([testDetail(id), activeChecklist()]);
  if (!test) notFound();
  const sub = test.submission;
  const s: string = test.status;
  const existing = Object.fromEntries(test.results.map((r) => [r.parameter, { outcome: r.outcome, notes: r.notes }]));
  const recorded = test.results.length;

  return (
    <div className="mx-auto max-w-7xl">
      <Link href={basePath} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> All physical tests
      </Link>
      <PageHeader
        eyebrow={`${test.code} · ${sub.code}`}
        title={sub.title}
        subtitle={`${MILLET_LABEL[sub.milletType]} · ${formatKg(sub.quantityGrams)} · ${sub.village}, ${sub.district}, ${sub.state}`}
        action={<StatusBadge map={TEST_STATUS} value={test.status} className="px-3 py-1 text-sm" />}
      />
      <div className="mb-6">
        <Notice tone="info" icon={Info}>
          This is the <strong>direct physical quality test</strong>: performed in person by our quality team on the collected sample. Record visual/physical observations
          only — do not describe results as laboratory certification.
        </Notice>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <Timeline
              steps={[
                { label: "Admin approved", state: "done" },
                { label: "Schedule collection", state: s === "PENDING" ? "current" : "done", detail: test.collection ? formatDate(test.collection.scheduledDate) : undefined },
                {
                  label: "Sample collected",
                  state: s === "COLLECTION_SCHEDULED" ? "current" : s === "PENDING" ? "upcoming" : "done",
                  detail: test.collection?.collectionDate ? `${formatDate(test.collection.collectionDate)} · ${test.collection.collectedBy?.name ?? ""}` : undefined,
                },
                {
                  label: "Physical testing",
                  state: ["PASSED", "FAILED"].includes(s) ? "done" : ["SAMPLE_COLLECTED", "TESTING", "ADDITIONAL_TESTING_REQUIRED"].includes(s) ? "current" : "upcoming",
                  detail: test.testingLocation ?? undefined,
                },
                {
                  label: "Result recorded",
                  state: s === "PASSED" ? "done" : s === "FAILED" ? "failed" : "upcoming",
                  detail: test.result ? TEST_STATUS[test.result].label : undefined,
                },
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="Farmer" icon={Phone} />
            <div className="space-y-1 p-5 text-sm">
              <p className="font-semibold text-earth-900">{sub.contactName}</p>
              <a href={`tel:${sub.contactPhone}`} className="block font-semibold text-leaf-700">{sub.contactPhone}</a>
              {sub.contactEmail && <p className="text-muted">{sub.contactEmail}</p>}
              <p className="text-muted">{sub.farmLocation ?? `${sub.village}, ${sub.district}`}</p>
              {sub.notes && <p className="mt-2 rounded-xl bg-cream p-2 text-xs">“{sub.notes}”</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Harvest" />
            <div className="p-5">
              <DetailList
                cols={1}
                items={[
                  ["Harvest date", formatDate(sub.harvestDate)],
                  ["Expected price", `${formatINR(sub.expectedPricePerKgPaise)}/kg`],
                  ["Cultivation", sub.cultivationMethod],
                  ["Processing", sub.processingMethod],
                  ["Storage", sub.storageMethod],
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          {test.status === "PENDING" && (
            <Card>
              <CardHeader title="Schedule sample collection" subtitle="Contact the farmer and agree a date. The farmer will be notified." icon={CalendarCheck} />
              <div className="p-5"><ScheduleForm testId={test.id} defaultLocation={sub.farmLocation ?? `${sub.village}, ${sub.district}`} /></div>
            </Card>
          )}
          {test.status === "COLLECTION_SCHEDULED" && (
            <Card>
              <CardHeader title="Record sample collection" subtitle={`Scheduled ${formatDate(test.collection?.scheduledDate)} at ${test.collection?.collectionLocation}`} icon={PackageCheck} />
              <div className="p-5"><CollectedForm testId={test.id} /></div>
            </Card>
          )}
          {(test.status === "SAMPLE_COLLECTED" || test.status === "ADDITIONAL_TESTING_REQUIRED") && (
            <Card>
              <CardHeader
                title={test.status === "ADDITIONAL_TESTING_REQUIRED" ? "Start additional testing" : "Receive sample & start testing"}
                subtitle={test.status === "ADDITIONAL_TESTING_REQUIRED" ? test.resultReason ?? undefined : `Sample: ${formatKg(test.sampleQuantityGrams)}`}
                icon={FlaskConical}
              />
              <div className="p-5"><StartTestingForm testId={test.id} code={test.code} /></div>
            </Card>
          )}

          {(["TESTING", "PASSED", "FAILED", "ADDITIONAL_TESTING_REQUIRED"] as string[]).includes(test.status) && (
            <Card>
              <CardHeader
                title="Physical testing checklist"
                subtitle={`${recorded}/${checklist.length} items recorded${test.testingLocation ? ` · ${test.testingLocation}` : ""}${test.batchNumber ? ` · Sample batch ${test.batchNumber}` : ""}`}
                icon={ClipboardCheck}
              />
              <div className="p-5">
                <ChecklistForm testId={test.id} items={checklist} existing={existing} testingNotes={test.testingNotes ?? ""} editable={test.status === "TESTING"} />
              </div>
            </Card>
          )}

          {test.status === "TESTING" && (
            <Card id="result">
              <CardHeader title="Submit physical test result" subtitle="Passing requires every checklist item recorded as Pass." icon={Trophy} />
              <div className="p-5"><ResultForm testId={test.id} initial={decision} /></div>
            </Card>
          )}

          {test.result && (
            <Notice tone={test.result === "PASSED" ? "success" : test.result === "FAILED" ? "danger" : "gold"} title={test.result === "PASSED" ? "Harvest approved for procurement." : test.result === "FAILED" ? "Harvest did not pass physical quality testing." : "Additional testing required"}>
              {test.resultReason ?? test.testingNotes} {test.testDate && <span className="block text-xs">Recorded {formatDateTime(test.testDate)} by {test.testedBy?.name}</span>}
            </Notice>
          )}

          <Card>
            <CardHeader title="Test photos, sample photos & reports" icon={Paperclip} />
            <div className="space-y-4 p-5">
              {test.attachments.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {test.attachments.map((a) => (
                    <li key={a.id}>
                      <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-cream p-2 text-sm hover:bg-cream-dark">
                        {a.mimeType.startsWith("image/") ? <img src={a.url} alt="" className="size-12 rounded-lg object-cover" /> : <FileText className="size-12 p-2 text-earth-500" />}
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{a.fileName}</span>
                          <span className="text-xs text-muted">{ATTACHMENT_KIND_LABEL[a.kind]}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No files uploaded yet.</p>
              )}
              {["SAMPLE_COLLECTED", "TESTING", "ADDITIONAL_TESTING_REQUIRED"].includes(test.status) && <AttachmentForm testId={test.id} />}
            </div>
          </Card>

          <Card>
            <CardHeader title="Farmer's submission photos" subtitle="Reference only" />
            <div className="p-5"><MediaGallery media={sub.media} /></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
