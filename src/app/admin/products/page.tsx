import Link from "next/link";
import { Store } from "lucide-react";
import { DemoBadge, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { archiveProductAction, publishProductAction } from "@/app/actions/operations";
import { requirePageRole } from "@/server/auth/guard";
import { listAdminProducts } from "@/server/services/inventory";
import { formatINR, formatKg, formatWeight } from "@/lib/format";
import { CATEGORY_LABEL, MILLET_LABEL, PRODUCT_STATUS } from "@/lib/labels";

export default async function AdminProductsPage() {
  await requirePageRole(["ADMIN"]);
  const rows = await listAdminProducts();
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Marketplace Products" subtitle="Listings are created from inventory batches. Publishing re-checks that the batch passed admin review, physical testing and procurement." action={<Link href="/admin/inventory" className="rounded-xl bg-leaf-700 px-4 py-2.5 text-sm font-semibold text-white">New listing from inventory</Link>} />
      {rows.length === 0 ? (
        <EmptyState icon={Store} title="No products yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Millet</th>
                <th>Pack</th>
                <th>Price / MRP</th>
                <th>Batch stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]?.url} alt="" className="size-10 rounded-lg object-cover" />
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-semibold text-leaf-700 hover:underline">{p.name}</Link>
                        {p.isDemo && <DemoBadge />}
                      </div>
                    </div>
                  </td>
                  <td>{CATEGORY_LABEL[p.category]}</td>
                  <td>{MILLET_LABEL[p.milletType]}</td>
                  <td>{formatWeight(p.weightGrams)}</td>
                  <td>{formatINR(p.pricePaise)} / {formatINR(p.mrpPaise)}</td>
                  <td>
                    {formatKg(p.inventory.quantityAvailableGrams)}
                    <p className="text-xs text-muted">{p.inventory.batch.batchNumber}</p>
                  </td>
                  <td><StatusBadge map={PRODUCT_STATUS} value={p.status} /></td>
                  <td>
                    {["MARKETPLACE_APPROVED", "ARCHIVED", "DRAFT"].includes(p.status) ? (
                      <ActionButton action={publishProductAction} fields={{ productId: p.id }}>Publish</ActionButton>
                    ) : (
                      <ActionButton action={archiveProductAction} fields={{ productId: p.id }} variant="dangerOutline" confirm="Hide this product from the marketplace?">Unpublish</ActionButton>
                    )}
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
