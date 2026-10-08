import Link from "next/link";
import { Layers } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { inspectedBatches } from "@/server/services/quality-records";
import { formatDate, formatKg } from "@/lib/format";
import { INVENTORY_STATUS, MILLET_LABEL } from "@/lib/labels";

export default async function BatchInspectionPage() {
  await requirePageRole(["QUALITY_TEAM"]);
  const batches = await inspectedBatches();
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Batch Inspection" subtitle="Every inventory batch traced back to the physical inspection that cleared it." />
      {batches.length === 0 ? (
        <EmptyState icon={Layers} title="No batches yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Harvest</th>
                <th>Farmer</th>
                <th>Millet</th>
                <th>Inspection</th>
                <th>Checks passed</th>
                <th>Inspected by</th>
                <th>Received</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const t = b.procurement.submission.physicalTest;
                const pass = t?.results.filter((r) => r.outcome === "PASS").length ?? 0;
                return (
                  <tr key={b.id}>
                    <td className="font-mono text-xs font-semibold">{b.batchNumber}</td>
                    <td>{b.procurement.submission.title}</td>
                    <td>{b.procurement.farmer.user.name}</td>
                    <td>{MILLET_LABEL[b.milletType]}</td>
                    <td>
                      {t ? <Link href={`/quality/tests/${t.id}`} className="font-mono text-xs font-semibold text-leaf-700 hover:underline">{t.code}</Link> : "—"}
                      <p className="text-xs text-muted">{formatDate(t?.testDate)}</p>
                    </td>
                    <td>{t ? `${pass}/${t.results.length}` : "—"}</td>
                    <td>{t?.testedBy?.name ?? "—"}</td>
                    <td>{formatKg(b.inventory?.quantityReceivedGrams)}</td>
                    <td><StatusBadge map={INVENTORY_STATUS} value={b.inventory?.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
