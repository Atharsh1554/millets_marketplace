import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import type { listTests } from "@/server/services/testing";
import { formatDate, formatKg } from "@/lib/format";
import { COLLECTION_STATUS, MILLET_LABEL, TEST_STATUS } from "@/lib/labels";

export const NEXT_ACTION: Record<string, string> = {
  PENDING: "Schedule Collection",
  COLLECTION_SCHEDULED: "Mark Sample Collected",
  SAMPLE_COLLECTED: "Start Testing",
  TESTING: "Enter Results",
  ADDITIONAL_TESTING_REQUIRED: "Start Testing",
  PASSED: "View",
  FAILED: "View",
};

type Test = Awaited<ReturnType<typeof listTests>>[number];

/** Physical testing table — shared by quality team pages and admin quality management. */
export function TestsTable({ tests, basePath, actionLabel, linkSuffix = "" }: { tests: Test[]; basePath: string; actionLabel?: (t: Test) => string; linkSuffix?: string }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Testing ID</th>
            <th>Farmer</th>
            <th>Harvest</th>
            <th>Millet</th>
            <th>Sample Qty</th>
            <th>Collection Status</th>
            <th>Testing Status</th>
            <th>Test Date</th>
            <th>Result</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t) => (
            <tr key={t.id}>
              <td className="font-mono text-xs font-semibold">{t.code}</td>
              <td>
                {t.submission.contactName}
                <p className="text-xs text-muted">{t.submission.village}, {t.submission.district}</p>
              </td>
              <td>
                {t.submission.title}
                <p className="text-xs text-muted">{formatKg(t.submission.quantityGrams)}</p>
              </td>
              <td>{MILLET_LABEL[t.submission.milletType]}</td>
              <td>{t.sampleQuantityGrams ? formatKg(t.sampleQuantityGrams) : "—"}</td>
              <td><StatusBadge map={COLLECTION_STATUS} value={t.collection?.status ?? null} /></td>
              <td><StatusBadge map={TEST_STATUS} value={t.status} /></td>
              <td>{formatDate(t.testDate)}</td>
              <td>{t.result ? <StatusBadge map={TEST_STATUS} value={t.result} /> : "—"}</td>
              <td>
                <Link href={`${basePath}/tests/${t.id}${linkSuffix}`} className="rounded-lg bg-leaf-700 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white hover:bg-leaf-800">
                  {actionLabel ? actionLabel(t) : NEXT_ACTION[t.status]}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
