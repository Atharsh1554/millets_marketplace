import Link from "next/link";
import { FileText, FileUp } from "lucide-react";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { AttachmentForm } from "@/components/quality/test-forms";
import { requirePageRole } from "@/server/auth/guard";
import { testsWithAttachments } from "@/server/services/quality-records";
import { ATTACHMENT_KIND_LABEL } from "@/lib/labels";

export default async function UploadReportsPage() {
  await requirePageRole(["QUALITY_TEAM"]);
  const tests = await testsWithAttachments();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Upload Test Reports" subtitle="Attach test photos, sample photos and PDF reports to inspections in progress." />
      {tests.length === 0 && <EmptyState icon={FileUp} title="No inspections accepting uploads">Uploads open once a sample has been collected.</EmptyState>}
      {tests.map((t) => (
        <Card key={t.id}>
          <CardHeader
            title={<Link href={`/quality/tests/${t.id}`} className="hover:underline">{t.submission.title}</Link>}
            subtitle={`${t.code} · ${t.submission.code} · ${t.attachments.length} file(s)`}
          />
          <div className="space-y-4 p-5">
            {t.attachments.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-cream p-2 text-sm hover:bg-cream-dark">
                      {a.mimeType.startsWith("image/") ? <img src={a.url} alt="" className="size-10 rounded-lg object-cover" /> : <FileText className="size-10 p-2 text-earth-500" />}
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a.fileName}</span>
                        <span className="text-xs text-muted">{ATTACHMENT_KIND_LABEL[a.kind]}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <AttachmentForm testId={t.id} />
          </div>
        </Card>
      ))}
    </div>
  );
}
