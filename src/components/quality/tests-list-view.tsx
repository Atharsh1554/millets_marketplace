import Link from "next/link";
import type { PhysicalTestStatus } from "@prisma/client";
import { CalendarClock, CheckCircle2, FlaskConical, Hourglass, XCircle } from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { listTests } from "@/server/services/testing";
import { cn } from "@/lib/format";
import { TEST_STATUS } from "@/lib/labels";
import { TestsTable } from "./tests-table";

const FILTERS: Array<[string, string]> = [
  ["", "All"],
  ["PENDING", "Awaiting collection"],
  ["COLLECTION_SCHEDULED", "Scheduled"],
  ["SAMPLE_COLLECTED", "Collected"],
  ["TESTING", "Testing"],
  ["ADDITIONAL_TESTING_REQUIRED", "Additional testing"],
  ["PASSED", "Passed"],
  ["FAILED", "Failed"],
];

/** The full physical-testing overview (stats + filter chips + table). */
export async function TestsListView({ status, basePath, eyebrow, title, subtitle }: { status?: string; basePath: string; eyebrow?: string; title: string; subtitle: string }) {
  const filter = status && status in TEST_STATUS ? (status as PhysicalTestStatus) : undefined;
  const [tests, all] = await Promise.all([listTests({ status: filter }), listTests()]);
  const count = (s: string[]) => all.filter((t) => s.includes(t.status)).length;
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Awaiting collection" value={count(["PENDING"])} icon={CalendarClock} tone="gold" />
        <StatCard label="Collected / testing" value={count(["COLLECTION_SCHEDULED", "SAMPLE_COLLECTED", "TESTING", "ADDITIONAL_TESTING_REQUIRED"])} icon={Hourglass} tone="sky" />
        <StatCard label="Passed" value={count(["PASSED"])} icon={CheckCircle2} />
        <StatCard label="Failed" value={count(["FAILED"])} icon={XCircle} tone="red" />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([v, l]) => (
          <Link
            key={v}
            href={v ? `${basePath}?status=${v}` : basePath}
            className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", (filter ?? "") === v ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}
          >
            {l}
          </Link>
        ))}
      </div>
      {tests.length === 0 ? <EmptyState icon={FlaskConical} title="No physical tests in this view" /> : <TestsTable tests={tests} basePath={basePath} />}
    </div>
  );
}

/** A fixed-filter list (e.g. Pending Inspections, Quality History). */
export async function FilteredTests({
  statuses,
  basePath,
  title,
  subtitle,
  empty,
  actionLabel,
  linkSuffix,
}: {
  statuses: PhysicalTestStatus[];
  basePath: string;
  title: string;
  subtitle: string;
  empty: string;
  actionLabel?: string;
  linkSuffix?: string;
}) {
  const tests = (await listTests()).filter((t) => statuses.includes(t.status));
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={title} subtitle={subtitle} />
      {tests.length === 0 ? (
        <EmptyState icon={FlaskConical} title={empty} />
      ) : (
        <TestsTable tests={tests} basePath={basePath} actionLabel={actionLabel ? () => actionLabel : undefined} linkSuffix={linkSuffix} />
      )}
    </div>
  );
}
