import Link from "next/link";
import { Truck } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { listProcurements } from "@/server/services/procurement";
import { formatDate, formatINR, formatKg } from "@/lib/format";
import { FARMER_PAYMENT_STATUS, MILLET_LABEL, PROCUREMENT_STATUS } from "@/lib/labels";

const ACTION: Record<string, string> = {
  PROCUREMENT_PENDING: "Schedule Collection",
  COLLECTION_SCHEDULED: "Mark Collected",
  COLLECTED: "Confirm Receipt",
  RECEIVED: "Move to Inventory",
  STORED: "Create Listing",
  READY_FOR_MARKETPLACE: "View",
};

export default async function ProcurementPage() {
  await requirePageRole(["ADMIN"]);
  const rows = await listProcurements();
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Procurement" subtitle="Only harvests that passed direct physical testing appear here. Procure, receive and move them into inventory." />
      {rows.length === 0 ? (
        <EmptyState icon={Truck} title="Nothing to procure yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Procurement ID</th>
                <th>Farmer</th>
                <th>Millet Type</th>
                <th>Qty Approved</th>
                <th>Qty Collected</th>
                <th>Farmer Price</th>
                <th>Collection Date</th>
                <th>Storage</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs font-semibold">
                    {p.code}
                    {p.batch && <p className="text-muted">{p.batch.batchNumber}</p>}
                  </td>
                  <td>
                    {p.farmer.user.name}
                    <p className="text-xs text-muted">{p.submission.title}</p>
                  </td>
                  <td>{MILLET_LABEL[p.milletType]}</td>
                  <td>{formatKg(p.approvedQuantityGrams)}</td>
                  <td>{p.actualQuantityGrams ? formatKg(p.actualQuantityGrams) : "—"}</td>
                  <td>{formatINR(p.agreedPricePerKgPaise)}/kg</td>
                  <td>{formatDate(p.collectionDate ?? p.scheduledDate)}</td>
                  <td className="text-xs">{p.storageLocation ?? "—"}</td>
                  <td><StatusBadge map={FARMER_PAYMENT_STATUS} value={p.farmerPayment?.status} /></td>
                  <td><StatusBadge map={PROCUREMENT_STATUS} value={p.status} /></td>
                  <td>
                    <Link href={p.batch?.inventory && p.status !== "RECEIVED" ? `/admin/inventory/${p.batch.inventory.id}` : `/admin/procurement/${p.id}`} className="rounded-lg bg-leaf-700 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white hover:bg-leaf-800">
                      {ACTION[p.status]}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
