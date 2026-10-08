import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FlaskConical, Truck, UserRound } from "lucide-react";
import { Card, CardHeader, DemoBadge, DetailList, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { Timeline } from "@/components/timeline";
import { MediaGallery } from "@/components/media-gallery";
import { requirePageRole } from "@/server/auth/guard";
import { submissionDetail } from "@/server/services/harvest";
import { db } from "@/server/db";
import { harvestTimeline } from "@/lib/harvest-timeline";
import { formatDate, formatDateTime, formatINR, formatKg } from "@/lib/format";
import { HARVEST_STATUS, MILLET_LABEL, PROCUREMENT_STATUS, TEST_STATUS } from "@/lib/labels";
import { ReviewForm } from "./review-form";
import { getT } from "@/i18n/server";

export default async function AdminSubmissionPage({ params }: PageProps<"/admin/submissions/[id]">) {
  await requirePageRole(["ADMIN"]);
  const { id } = await params;
  const sub = await submissionDetail(id);
  if (!sub) notFound();
  const history = await db.harvestSubmission.groupBy({ by: ["status"], where: { farmerId: sub.farmerId }, _count: { _all: true } });
  const canReview = sub.status === "ADMIN_REVIEW_PENDING" && !sub.infoRequested;

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/admin/submissions" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> All submissions
      </Link>
      <PageHeader
        eyebrow={sub.code}
        title={<span className="flex flex-wrap items-center gap-2">{sub.title} {sub.isDemo && <DemoBadge />}</span>}
        subtitle={`${MILLET_LABEL[sub.milletType]} · ${formatKg(sub.quantityGrams)} · expected ${formatINR(sub.expectedPricePerKgPaise)}/kg`}
        action={<StatusBadge map={HARVEST_STATUS} value={sub.status} className="px-3 py-1 text-sm" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Harvest details" />
            <div className="space-y-4 p-5">
              <DetailList
                cols={3}
                items={[
                  ["Millet type", MILLET_LABEL[sub.milletType]],
                  ["Quantity", formatKg(sub.quantityGrams)],
                  ["Expected price", `${formatINR(sub.expectedPricePerKgPaise)}/kg`],
                  ["Harvest date", formatDate(sub.harvestDate)],
                  ["Farm location", sub.farmLocation ?? `${sub.village}, ${sub.district}`],
                  ["State", sub.state],
                  ["Cultivation", sub.cultivationMethod],
                  ["Processing", sub.processingMethod],
                  ["Storage", sub.storageMethod],
                ]}
              />
              <div>
                <p className="text-xs font-medium tracking-wide text-muted uppercase">Description</p>
                <p className="mt-1 text-sm text-earth-900">{sub.description}</p>
              </div>
              {sub.notes && (
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">Farmer notes</p>
                  <p className="mt-1 text-sm text-earth-900">{sub.notes}</p>
                </div>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Photos & video" subtitle="Uploaded by the farmer for reference — reviewed by people, never auto-graded." />
            <div className="p-5"><MediaGallery media={sub.media} /></div>
          </Card>
          {sub.adminReviews.length > 0 && (
            <Card>
              <CardHeader title="Review history" />
              <ul className="divide-y divide-earth-100">
                {sub.adminReviews.map((r) => (
                  <li key={r.id} className="space-y-1 p-5 text-sm">
                    <p className="font-semibold">{r.decision.replaceAll("_", " ")} · <span className="font-normal text-muted">{r.reviewer.name}, {formatDateTime(r.createdAt)}</span></p>
                    {r.comments && <p>Comments: {r.comments}</p>}
                    {r.requestedChanges && <p>Requested: {r.requestedChanges}</p>}
                    {r.adminNotes && <p className="text-muted">Internal: {r.adminNotes}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {canReview ? (
            <Card>
              <CardHeader title="Admin review" subtitle="Decide on the online submission" />
              <div className="p-5"><ReviewForm submissionId={sub.id} /></div>
            </Card>
          ) : sub.infoRequested ? (
            <Notice tone="gold" title="Waiting for the farmer">More information was requested. The farmer can update and resubmit.</Notice>
          ) : null}

          <Card>
            <CardHeader title="Farmer profile" icon={UserRound} />
            <div className="space-y-1 p-5 text-sm">
              <p className="font-semibold text-earth-900">{sub.farmer.user.name}</p>
              <p>{sub.contactPhone}</p>
              <p className="text-muted">{sub.contactEmail ?? sub.farmer.user.email}</p>
              <p className="text-muted">{sub.village}, {sub.district}, {sub.state}</p>
              <p className="pt-2 text-xs text-muted">Member since {formatDate(sub.farmer.user.createdAt)}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {history.map((h) => (
                  <span key={h.status} className="rounded-full bg-cream px-2 py-0.5 text-[11px]">{HARVEST_STATUS[h.status]?.label}: {h._count._all}</span>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-earth-900">Workflow</h2>
            <Timeline compact steps={harvestTimeline({ status: sub.status, infoRequested: sub.infoRequested, procurement: sub.procurement, soldGrams: sub.procurement?.batch?.inventory?.quantitySoldGrams }, await getT())} />
            <div className="mt-4 space-y-2">
              {sub.physicalTest && (
                <Link href={`/admin/quality/tests/${sub.physicalTest.id}`} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm hover:bg-cream-dark">
                  <span className="flex items-center gap-2"><FlaskConical className="size-4" /> {sub.physicalTest.code}</span>
                  <StatusBadge map={TEST_STATUS} value={sub.physicalTest.status} />
                </Link>
              )}
              {sub.procurement && (
                <Link href={`/admin/procurement/${sub.procurement.id}`} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm hover:bg-cream-dark">
                  <span className="flex items-center gap-2"><Truck className="size-4" /> {sub.procurement.code}</span>
                  <StatusBadge map={PROCUREMENT_STATUS} value={sub.procurement.status} />
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
