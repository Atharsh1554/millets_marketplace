import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackagePlus, Settings2, Store } from "lucide-react";
import { Card, CardHeader, DetailList, PageHeader, StatusBadge } from "@/components/ui";
import { ActionButton, ActionForm, SelectField, SubmitButton, TextArea, TextField } from "@/components/forms";
import { archiveProductAction, createProductAction, publishProductAction, updateInventoryAction } from "@/app/actions/operations";
import { requirePageRole } from "@/server/auth/guard";
import { inventoryDetail } from "@/server/services/inventory";
import { formatDate, formatINR, formatKg, formatWeight } from "@/lib/format";
import { CATEGORIES, CATEGORY_LABEL, INVENTORY_STATUS, MILLET_LABEL, MILLET_SHORT, PRODUCT_STATUS } from "@/lib/labels";

export default async function InventoryDetailPage({ params }: PageProps<"/admin/inventory/[id]">) {
  await requirePageRole(["ADMIN"]);
  const { id } = await params;
  const inv = await inventoryDetail(id);
  if (!inv) notFound();
  const proc = inv.batch.procurement;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/inventory" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> Inventory
      </Link>
      <PageHeader
        eyebrow={`Batch ${inv.batch.batchNumber}`}
        title={proc.submission.title}
        subtitle={`${MILLET_LABEL[inv.batch.milletType]} · ${proc.farmer.user.name} · ${proc.submission.village}, ${proc.submission.state}`}
        action={<StatusBadge map={INVENTORY_STATUS} value={inv.status} className="px-3 py-1 text-sm" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Stock" />
            <div className="p-5">
              <DetailList
                cols={3}
                items={[
                  ["Quantity received", formatKg(inv.quantityReceivedGrams)],
                  ["Quantity available", <strong key="a">{formatKg(inv.quantityAvailableGrams)}</strong>],
                  ["Quantity sold", formatKg(inv.quantitySoldGrams)],
                  ["Purchase price", `${formatINR(inv.purchasePricePerKgPaise)}/kg`],
                  ["Selling price", `${formatINR(inv.sellingPricePerKgPaise)}/kg`],
                  ["Storage", inv.storageLocation],
                  ["Procurement", proc.code],
                  ["Harvest year", inv.batch.harvestYear],
                  ["Received", formatDate(proc.receivedDate)],
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Marketplace listings" subtitle="Products sold from this batch. Each unit sold deducts its pack size from this lot." icon={Store} />
            {inv.products.length === 0 ? (
              <p className="p-5 text-sm text-muted">No listings yet. Create one with the form.</p>
            ) : (
              <ul className="divide-y divide-earth-100">
                {inv.products.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                    <img src={p.images[0]?.url} alt="" className="size-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-earth-900">{p.name}</p>
                      <p className="text-xs text-muted">
                        {CATEGORY_LABEL[p.category]} · {formatWeight(p.weightGrams)} · {formatINR(p.pricePaise)} (MRP {formatINR(p.mrpPaise)}) · {Math.floor(inv.quantityAvailableGrams / p.weightGrams)} units in stock
                      </p>
                    </div>
                    <StatusBadge map={PRODUCT_STATUS} value={p.status} />
                    <div className="flex gap-2">
                      {["MARKETPLACE_APPROVED", "ARCHIVED", "DRAFT"].includes(p.status) && (
                        <ActionButton action={publishProductAction} fields={{ productId: p.id }}>Publish</ActionButton>
                      )}
                      {["AVAILABLE_FOR_SALE", "SOLD_OUT"].includes(p.status) && (
                        <>
                          <Link href={`/shop/${p.slug}`} className="rounded-xl border border-earth-200 bg-white px-3 py-1.5 text-sm font-semibold">View</Link>
                          <ActionButton action={archiveProductAction} fields={{ productId: p.id }} variant="dangerOutline" confirm="Hide this product from the marketplace?">Unpublish</ActionButton>
                        </>
                      )}
                      <Link href={`/admin/products/${p.id}`} className="rounded-xl border border-earth-200 bg-white px-3 py-1.5 text-sm font-semibold">Edit</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Inventory settings" icon={Settings2} />
            <ActionForm action={updateInventoryAction} className="grid gap-4 p-5 sm:grid-cols-4 sm:items-end">
              <input type="hidden" name="inventoryId" value={inv.id} />
              <TextField label="Selling price (₹/kg)" name="sellingPricePerKg" type="number" step="0.5" required defaultValue={inv.sellingPricePerKgPaise / 100} />
              <TextField label="Low stock at (kg)" name="lowStockThresholdKg" type="number" step="1" required defaultValue={inv.lowStockThresholdGrams / 1000} />
              <TextField label="Storage location" name="storageLocation" required defaultValue={inv.storageLocation} />
              <SubmitButton variant="outline">Save</SubmitButton>
            </ActionForm>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Create marketplace listing" subtitle="Starts as Marketplace Approved — publish to make it visible." icon={PackagePlus} />
          <ActionForm action={createProductAction} resetOnSuccess className="space-y-4 p-5">
            <input type="hidden" name="inventoryId" value={inv.id} />
            <TextField label="Product name" name="name" required defaultValue={`${MILLET_SHORT[inv.batch.milletType]} — ${proc.submission.title}`} />
            <SelectField label="Category" name="category" options={CATEGORIES.map((c) => [c, CATEGORY_LABEL[c]])} />
            <div className="grid grid-cols-3 gap-3">
              <TextField label="Pack (g)" name="weightGrams" type="number" step="50" min="50" required defaultValue={1000} />
              <TextField label="Price ₹" name="price" type="number" step="1" required defaultValue={inv.sellingPricePerKgPaise / 100} />
              <TextField label="MRP ₹" name="mrp" type="number" step="1" required defaultValue={Math.round((inv.sellingPricePerKgPaise / 100) * 1.15)} />
            </div>
            <TextArea label="Description" name="description" required rows={4} defaultValue={`${MILLET_LABEL[inv.batch.milletType]} from ${proc.submission.village}, ${proc.submission.district}. Physically tested and procured by our team.`} />
            <div>
              <label className="label" htmlFor="image">Product image (optional)</label>
              <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2" />
              <p className="mt-1 text-xs text-muted">Defaults to the millet illustration.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" className="size-4 accent-leaf-700" /> Feature on homepage
            </label>
            <p className="text-xs text-muted">Avoid unverified claims such as “organic”, “100% pure” or “certified”.</p>
            <SubmitButton className="w-full">Create listing</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
