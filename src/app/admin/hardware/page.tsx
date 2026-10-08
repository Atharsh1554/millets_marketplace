import Link from "next/link";
import { MessageSquare, Plus, Wrench } from "lucide-react";
import { Badge, EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { hardwareStatusAction } from "@/app/actions/hardware";
import { requirePageRole } from "@/server/auth/guard";
import { HARDWARE_PLACEHOLDER, adminListHardware } from "@/server/services/hardware";
import { db } from "@/server/db";
import { formatDate } from "@/lib/format";
import { HARDWARE_STATUS } from "@/lib/labels";

const CATEGORY_LABEL: Record<string, string> = {
  PROCESSING: "Millet Processing",
  DEHULLING: "Dehulling",
  CLEANING: "Grain Cleaning",
  DRYING: "Drying",
  STORAGE: "Storage",
  WEIGHING: "Weighing",
  OTHER: "Other Hardware",
};

export default async function AdminHardwarePage() {
  await requirePageRole(["ADMIN"]);
  const [products, newEnquiries] = await Promise.all([adminListHardware(), db.hardwareEnquiry.count({ where: { status: "NEW" } })]);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Hardware Products"
        subtitle="Equipment shown to farmers under Featured Hardware. Only published products are visible to farmers."
        action={
          <>
            <LinkButton href="/admin/hardware/enquiries" variant="outline">
              <MessageSquare className="size-4" /> Enquiries {newEnquiries > 0 && <Badge tone="warning">{newEnquiries} new</Badge>}
            </LinkButton>
            <LinkButton href="/admin/hardware/new">
              <Plus className="size-4" /> Add hardware
            </LinkButton>
          </>
        }
      />
      {products.length === 0 ? (
        <EmptyState icon={Wrench} title="No hardware products yet" action={<LinkButton href="/admin/hardware/new">Add the first product</LinkButton>}>
          Add machines farmers may need — dehullers, cleaners, dryers, storage bins, weighing scales.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Status</th>
                <th>Enquiries</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]?.url ?? HARDWARE_PLACEHOLDER[p.category]} alt="" className="size-12 rounded-lg object-cover" />
                      <div>
                        <Link href={`/admin/hardware/${p.id}`} className="font-semibold text-leaf-700 hover:underline">{p.name}</Link>
                        {p.featured && <Badge tone="gold" className="ml-2">Featured</Badge>}
                        <p className="line-clamp-1 text-xs text-muted">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>{CATEGORY_LABEL[p.category]}</td>
                  <td><StatusBadge map={HARDWARE_STATUS} value={p.status} /></td>
                  <td>{p._count.enquiries}</td>
                  <td className="text-xs">{formatDate(p.updatedAt)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/hardware/${p.id}`} className="rounded-xl border border-earth-200 bg-white px-3 py-1.5 text-sm font-semibold">Edit</Link>
                      {p.status !== "PUBLISHED" && <ActionButton action={hardwareStatusAction} fields={{ productId: p.id, status: "PUBLISHED" }}>Publish</ActionButton>}
                      {p.status === "PUBLISHED" && <ActionButton action={hardwareStatusAction} fields={{ productId: p.id, status: "DRAFT" }} variant="outline">Unpublish</ActionButton>}
                      {p.status !== "ARCHIVED" && (
                        <ActionButton action={hardwareStatusAction} fields={{ productId: p.id, status: "ARCHIVED" }} variant="dangerOutline" confirm="Archive this product? Farmers will no longer see it.">
                          Archive
                        </ActionButton>
                      )}
                    </div>
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
