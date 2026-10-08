import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { ActionForm, SubmitButton, TextArea, TextField } from "@/components/forms";
import { updateProductAction } from "@/app/actions/operations";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { formatWeight } from "@/lib/format";
import { PRODUCT_STATUS } from "@/lib/labels";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requirePageRole(["ADMIN"]);
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id }, include: { images: true, inventory: { include: { batch: true } } } });
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin/inventory/${p.inventoryId}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> Batch {p.inventory.batch.batchNumber}
      </Link>
      <PageHeader title={`Edit ${p.name}`} subtitle={`${formatWeight(p.weightGrams)} pack`} action={<StatusBadge map={PRODUCT_STATUS} value={p.status} />} />
      <Card className="p-5">
        <ActionForm action={updateProductAction} className="space-y-4">
          <input type="hidden" name="productId" value={p.id} />
          <TextField label="Product name" name="name" required defaultValue={p.name} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Price (₹)" name="price" type="number" step="1" required defaultValue={p.pricePaise / 100} />
            <TextField label="MRP (₹)" name="mrp" type="number" step="1" required defaultValue={p.mrpPaise / 100} />
          </div>
          <TextArea label="Description" name="description" required rows={5} defaultValue={p.description} />
          <div className="flex items-center gap-4">
            <img src={p.images[0]?.url} alt="" className="size-20 rounded-xl object-cover" />
            <div className="flex-1">
              <label className="label" htmlFor="image">Replace image</label>
              <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input py-2" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={p.featured} className="size-4 accent-leaf-700" /> Feature on homepage
          </label>
          <SubmitButton>Save changes</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
