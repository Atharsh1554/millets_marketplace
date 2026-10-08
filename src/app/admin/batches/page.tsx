import Link from "next/link";
import { Layers } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { inspectedBatches } from "@/server/services/quality-records";
import { db } from "@/server/db";
import { formatDate, formatKg } from "@/lib/format";
import { INVENTORY_STATUS, MILLET_LABEL } from "@/lib/labels";

export default async function AdminBatchesPage() {
  await requirePageRole(["ADMIN"]);
  const [batches, inv] = await Promise.all([inspectedBatches(), db.inventory.findMany({ select: { id: true, batchId: true, quantitySoldGrams: true } })]);
  const invByBatch = new Map(inv.map((i) => [i.batchId, i]));
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Batches" subtitle="Traceable batches created from procured harvests: farmer → physical test → procurement → inventory." />
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
                <th>Year</th>
                <th>Inspection</th>
                <th>Procurement</th>
                <th>Received</th>
                <th>Available</th>
                <th>Sold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const i = invByBatch.get(b.id);
                const t = b.procurement.submission.physicalTest;
                return (
                  <tr key={b.id}>
                    <td>
                      {i ? (
                        <Link href={`/admin/inventory/${i.id}`} className="font-mono text-xs font-semibold text-leaf-700 hover:underline">{b.batchNumber}</Link>
                      ) : (
                        <span className="font-mono text-xs font-semibold">{b.batchNumber}</span>
                      )}
                      <p className="text-xs text-muted">{formatDate(b.createdAt)}</p>
                    </td>
                    <td>{b.procurement.submission.title}</td>
                    <td>{b.procurement.farmer.user.name}</td>
                    <td>{MILLET_LABEL[b.milletType]}</td>
                    <td>{b.harvestYear}</td>
                    <td>{t ? <Link href={`/admin/quality/tests/${t.id}`} className="font-mono text-xs text-leaf-700 hover:underline">{t.code}</Link> : "—"}</td>
                    <td className="font-mono text-xs">{b.procurement.code}</td>
                    <td>{formatKg(b.inventory?.quantityReceivedGrams)}</td>
                    <td>{formatKg(b.inventory?.quantityAvailableGrams)}</td>
                    <td>{formatKg(i?.quantitySoldGrams)}</td>
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
