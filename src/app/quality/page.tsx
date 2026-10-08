import Link from "next/link";
import { BadgeCheck, CalendarClock, ClipboardList, FlaskConical, Microscope, XCircle } from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { listTests } from "@/server/services/testing";
import { formatDate, formatKg } from "@/lib/format";
import { MILLET_LABEL, TEST_STATUS } from "@/lib/labels";

export default async function QualityDashboard() {
  const user = await requirePageRole(["QUALITY_TEAM"]);
  const all = await listTests();
  const by = (s: string[]) => all.filter((t) => s.includes(t.status));
  const pending = by(["PENDING", "COLLECTION_SCHEDULED", "SAMPLE_COLLECTED"]);
  const verifying = by(["TESTING", "ADDITIONAL_TESTING_REQUIRED"]);
  const recent = by(["PASSED", "FAILED"]).sort((a, b) => +(b.testDate ?? 0) - +(a.testDate ?? 0)).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Direct physical testing" title={`Hello, ${user.name.split(" ")[0]}`} subtitle="Contact the farmer, collect a sample, perform the physical checklist and record the result." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Awaiting collection" value={by(["PENDING"]).length} icon={CalendarClock} tone="gold" />
        <StatCard label="Pending inspections" value={pending.length} icon={ClipboardList} tone="sky" />
        <StatCard label="In verification" value={verifying.length} icon={Microscope} tone="earth" />
        <StatCard label="Verified (passed)" value={by(["PASSED"]).length} icon={BadgeCheck} />
        <StatCard label="Rejected (failed)" value={by(["FAILED"]).length} icon={XCircle} tone="red" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Queue title="Pending inspections" href="/quality/pending" rows={pending} />
        <Queue title="Product verification" href="/quality/verification" rows={verifying} />
        <Queue title="Recently completed" href="/quality/history" rows={recent} />
      </div>
    </div>
  );
}

function Queue({ title, href, rows }: { title: string; href: string; rows: Awaited<ReturnType<typeof listTests>> }) {
  return (
    <Card>
      <CardHeader title={title} icon={FlaskConical} action={<Link href={href} className="text-sm font-semibold text-leaf-700 hover:underline">All →</Link>} />
      <ul className="divide-y divide-earth-100">
        {rows.length === 0 && <li className="p-5 text-sm text-muted">Nothing here.</li>}
        {rows.slice(0, 6).map((t) => (
          <li key={t.id}>
            <Link href={`/quality/tests/${t.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-cream">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-earth-900">{t.submission.title}</span>
                <span className="block truncate text-xs text-muted">
                  {t.code} · {MILLET_LABEL[t.submission.milletType]} · {formatKg(t.submission.quantityGrams)} · {formatDate(t.testDate ?? t.createdAt)}
                </span>
              </span>
              <StatusBadge map={TEST_STATUS} value={t.status} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
