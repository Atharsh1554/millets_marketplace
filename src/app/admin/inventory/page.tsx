import Link from "next/link";
import { Warehouse } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { listInventory } from "@/server/services/inventory";
import { formatINR, formatKg } from "@/lib/format";
import { INVENTORY_STATUS, MILLET_LABEL } from "@/lib/labels";

export default async function InventoryPage() {
  await requirePageRole(["ADMIN"]);
  const rows = await listInventory();
  const total = rows.reduce((s, r) => s + r.quantityAvailableGrams, 0);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Inventory" subtitle={`${rows.length} batches · ${formatKg(total)} available. Quantities decrease automatically when customers buy.`} />
      {rows.length === 0 ? (
        <EmptyState icon={Warehouse} title="No inventory yet">Procured harvests appear here after “Move to Inventory”.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product(s)</th>
                <th>Batch</th>
                <th>Farmer</th>
                <th>Millet Type</th>
                <th>Received</th>
                <th>Available</th>
                <th>Sold</th>
                <th>Storage</th>
                <th>Purchase / Selling</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/inventory/${r.id}`} className="font-semibold text-leaf-700 hover:underline">
                      {r.products.length ? r.products.map((p) => p.name).join(", ") : "No listing yet — create one"}
                    </Link>
                  </td>
                  <td className="font-mono text-xs font-semibold">{r.batch.batchNumber}</td>
                  <td>{r.batch.procurement.farmer.user.name}</td>
                  <td>{MILLET_LABEL[r.batch.milletType]}</td>
                  <td>{formatKg(r.quantityReceivedGrams)}</td>
                  <td className="font-semibold">{formatKg(r.quantityAvailableGrams)}</td>
                  <td>{formatKg(r.quantitySoldGrams)}</td>
                  <td className="text-xs">{r.storageLocation}</td>
                  <td className="text-xs">
                    {formatINR(r.purchasePricePerKgPaise)} / {formatINR(r.sellingPricePerKgPaise)} per kg
                  </td>
                  <td><StatusBadge map={INVENTORY_STATUS} value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
