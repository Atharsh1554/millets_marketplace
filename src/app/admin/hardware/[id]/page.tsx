import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Images } from "lucide-react";
import { Card, CardHeader, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { deleteHardwareImageAction, hardwareStatusAction } from "@/app/actions/hardware";
import { requirePageRole } from "@/server/auth/guard";
import { hardwareById } from "@/server/services/hardware";
import { formatDateTime } from "@/lib/format";
import { HARDWARE_STATUS } from "@/lib/labels";
import { HardwareForm } from "../hardware-form";

export default async function EditHardwarePage({ params, searchParams }: PageProps<"/admin/hardware/[id]">) {
  await requirePageRole(["ADMIN"]);
  const p = await hardwareById((await params).id);
  if (!p) notFound();
  const created = (await searchParams).created === "1";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/hardware" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
          <ArrowLeft className="size-4" /> Hardware products
        </Link>
        <PageHeader
          title={p.name}
          subtitle={`Last updated ${formatDateTime(p.updatedAt)}${p.publishedAt ? ` · first published ${formatDateTime(p.publishedAt)}` : ""}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge map={HARDWARE_STATUS} value={p.status} className="px-3 py-1 text-sm" />
              {p.status !== "PUBLISHED" && <ActionButton action={hardwareStatusAction} fields={{ productId: p.id, status: "PUBLISHED" }} size="md">Publish</ActionButton>}
              {p.status === "PUBLISHED" && <ActionButton action={hardwareStatusAction} fields={{ productId: p.id, status: "DRAFT" }} variant="outline" size="md">Unpublish</ActionButton>}
              {p.status !== "ARCHIVED" && (
                <ActionButton action={hardwareStatusAction} fields={{ productId: p.id, status: "ARCHIVED" }} variant="dangerOutline" size="md" confirm="Archive this product? Farmers will no longer see it.">
                  Archive
                </ActionButton>
              )}
            </div>
          }
        />
      </div>
      {created && <Notice tone="success" title="Draft created">Review the details, then publish to show it to farmers.</Notice>}

      <Card>
        <CardHeader title="Images" subtitle={`${p.images.length} uploaded — add more in the form below`} icon={Images} />
        <div className="p-5">
          {p.images.length === 0 ? (
            <p className="text-sm text-muted">No images yet. Farmers will see a category illustration until you upload one.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {p.images.map((img) => (
                <li key={img.id} className="space-y-2">
                  <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full rounded-xl object-cover" />
                  <ActionButton action={deleteHardwareImageAction} fields={{ id: img.id }} variant="dangerOutline" confirm="Remove this image?" className="w-full">
                    Remove
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <HardwareForm
          imageCount={p.images.length}
          initial={{
            productId: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            mainBenefit: p.mainBenefit,
            overview: p.overview,
            features: p.features,
            benefits: p.benefits,
            specifications: p.specifications,
            suitableFor: p.suitableFor,
            howItWorks: p.howItWorks,
            featured: p.featured,
          }}
        />
      </Card>
    </div>
  );
}
