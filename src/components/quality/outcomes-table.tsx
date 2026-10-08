import Link from "next/link";
import { BadgeCheck, XCircle } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { testOutcomes } from "@/server/services/quality-records";
import { formatDate, formatKg } from "@/lib/format";
import { MILLET_LABEL, PRODUCT_STATUS, PROCUREMENT_STATUS } from "@/lib/labels";

/** Verified (PASSED) or Rejected (FAILED) products with their downstream status. */
export async function OutcomesView({ status, basePath }: { status: "PASSED" | "FAILED"; basePath: string }) {
  const rows = await testOutcomes(status);
  const passed = status === "PASSED";
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={passed ? "Verified Products" : "Rejected Products"}
        subtitle={passed ? "Harvests that passed direct physical testing, and where they are now." : "Harvests that did not pass physical testing, with the reason shared with the farmer."}
      />
      {rows.length === 0 ? (
        <EmptyState icon={passed ? BadgeCheck : XCircle} title={passed ? "No verified products yet" : "No rejected products"} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Inspection</th>
                <th>Harvest</th>
                <th>Farmer</th>
                <th>Millet</th>
                <th>Quantity</th>
                <th>Tested</th>
                <th>By</th>
                <th>{passed ? "Procurement / batch" : "Reason"}</th>
                {passed && <th>Products</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`${basePath}/tests/${t.id}`} className="font-mono text-xs font-semibold text-leaf-700 hover:underline">{t.code}</Link>
                  </td>
                  <td>
                    {t.submission.title}
                    <p className="text-xs text-muted">{t.submission.code}</p>
                  </td>
                  <td>
                    {t.submission.contactName}
                    <p className="text-xs text-muted">{t.submission.district}</p>
                  </td>
                  <td>{MILLET_LABEL[t.submission.milletType]}</td>
                  <td>{formatKg(t.submission.quantityGrams)}</td>
                  <td>{formatDate(t.testDate)}</td>
                  <td>{t.testedBy?.name ?? "—"}</td>
                  {passed ? (
                    <td>
                      <StatusBadge map={PROCUREMENT_STATUS} value={t.submission.procurement?.status} />
                      {t.submission.procurement?.batch && <p className="mt-1 font-mono text-xs">{t.submission.procurement.batch.batchNumber}</p>}
                    </td>
                  ) : (
                    <td className="max-w-xs text-xs">{t.resultReason}</td>
                  )}
                  {passed && (
                    <td className="space-y-1">
                      {t.submission.procurement?.batch?.inventory?.products.map((p) => (
                        <div key={p.name} className="flex items-center gap-1 text-xs">
                          {p.name} <StatusBadge map={PRODUCT_STATUS} value={p.status} />
                        </div>
                      )) ?? "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
