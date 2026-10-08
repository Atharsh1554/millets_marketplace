import { notFound } from "next/navigation";
import { CheckCircle2, FlaskConical, MessageSquare, XCircle } from "lucide-react";
import { Card, CardHeader, DetailList, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { Timeline } from "@/components/timeline";
import { MediaGallery } from "@/components/media-gallery";
import { HarvestForm } from "@/components/farmer/harvest-form";
import { requirePageRole } from "@/server/auth/guard";
import { submissionDetail } from "@/server/services/harvest";
import { harvestTimeline } from "@/lib/harvest-timeline";
import { formatDate, formatDateTime, formatINR, formatKg } from "@/lib/format";
import { CHECK_OUTCOME, HARVEST_STATUS } from "@/lib/labels";
import { getT } from "@/i18n/server";
import { translateMessage } from "@/i18n/translate";

export default async function FarmerHarvestPage({ params, searchParams }: PageProps<"/farmer/harvests/[id]">) {
  const user = await requirePageRole(["FARMER"]);
  const { id } = await params;
  const [sub, t] = await Promise.all([submissionDetail(id), getT()]);
  // Farmers can only open their own submissions.
  if (!sub || sub.farmerId !== user.farmer?.id) notFound();
  const justSubmitted = (await searchParams).submitted === "1";

  const latestReview = sub.adminReviews[0];
  const test = sub.physicalTest;
  const proc = sub.procurement;
  const inv = proc?.batch?.inventory;
  const editable = sub.status === "DRAFT" || (sub.status === "ADMIN_REVIEW_PENDING" && sub.infoRequested);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={sub.code}
        title={sub.title}
        subtitle={`${t(`labels.millet.${sub.milletType}`)} · ${formatKg(sub.quantityGrams)} · ${t("farmer.expectedPrice", { price: formatINR(sub.expectedPricePerKgPaise) })}`}
        action={<StatusBadge map={HARVEST_STATUS} value={sub.status} className="px-3 py-1 text-sm" />}
      />

      {justSubmitted && (
        <div className="mb-6">
          <Notice tone="success" icon={CheckCircle2} title={t("farmer.submittedTitle")}>
            {t("farmer.submittedText")}
          </Notice>
        </div>
      )}
      {sub.status === "ADMIN_REJECTED" && (
        <div className="mb-6">
          <Notice tone="danger" icon={XCircle} title={t("farmer.rejectedTitle")}>{latestReview?.comments}</Notice>
        </div>
      )}
      {sub.status === "PHYSICAL_TEST_FAILED" && (
        <div className="mb-6">
          <Notice tone="danger" icon={XCircle} title={t("farmer.failedTitle")}>{test?.resultReason}</Notice>
        </div>
      )}
      {sub.infoRequested && (
        <div className="mb-6">
          <Notice tone="gold" icon={MessageSquare} title={t("farmer.infoTitle")}>
            {t("farmer.infoText", { details: latestReview?.requestedChanges ?? "" })}
          </Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-earth-900">{t("farmer.progress")}</h2>
            <Timeline steps={harvestTimeline({ status: sub.status, infoRequested: sub.infoRequested, procurement: proc, soldGrams: inv?.quantitySoldGrams }, t)} />
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-earth-900">{t("farmer.activity")}</h2>
            <ul className="space-y-3 text-sm">
              {[...sub.events].reverse().map((e) => (
                <li key={e.id}>
                  <p className="font-medium text-earth-900">{t(`labels.harvestStatus.${e.status}`)}</p>
                  {e.note && <p className="text-xs text-earth-700">{translateMessage(t, e.note)}</p>}
                  <p className="text-[11px] text-muted">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          {editable ? (
            <HarvestForm
              existingMedia={sub.media.length}
              defaults={{
                submissionId: sub.id,
                title: sub.title,
                contactName: sub.contactName,
                contactPhone: sub.contactPhone,
                contactEmail: sub.contactEmail ?? "",
                village: sub.village,
                district: sub.district,
                state: sub.state,
                farmLocation: sub.farmLocation ?? "",
                milletType: sub.milletType,
                harvestDate: sub.harvestDate.toISOString().slice(0, 10),
                quantityKg: String(sub.quantityGrams / 1000),
                expectedPricePerKg: String(sub.expectedPricePerKgPaise / 100),
                cultivationMethod: sub.cultivationMethod,
                processingMethod: sub.processingMethod,
                storageMethod: sub.storageMethod,
                description: sub.description,
                notes: sub.notes ?? "",
              }}
            />
          ) : (
            <Card>
              <CardHeader title={t("farmer.details")} />
              <div className="p-5">
                <DetailList
                  items={[
                    [t("fields.harvestDate"), formatDate(sub.harvestDate)],
                    [t("farmer.colQuantity"), formatKg(sub.quantityGrams)],
                    [t("fields.expectedPrice"), `${formatINR(sub.expectedPricePerKgPaise)}/kg`],
                    [t("farmer.location"), `${sub.village}, ${sub.district}, ${sub.state}`],
                    [t("fields.cultivationMethod"), sub.cultivationMethod],
                    [t("fields.processingMethod"), sub.processingMethod],
                    [t("fields.storageMethod"), sub.storageMethod],
                    [t("farmer.colSubmitted"), formatDateTime(sub.submittedAt)],
                  ]}
                />
                <p className="mt-4 text-sm text-earth-800">{sub.description}</p>
              </div>
            </Card>
          )}

          {test && test.status !== "PENDING" && (
            <Card>
              <CardHeader title={t("farmer.physicalTesting")} subtitle={test.code} icon={FlaskConical} />
              <div className="space-y-4 p-5">
                <DetailList
                  cols={3}
                  items={[
                    [t("farmer.collectionDate"), formatDate(test.collection?.collectionDate ?? test.collection?.scheduledDate)],
                    [t("farmer.collectedBy"), test.collection?.collectedBy?.name ?? t("farmer.ourQualityTeam")],
                    [t("farmer.testDate"), formatDate(test.testDate)],
                  ]}
                />
                {test.results.length > 0 && ["PASSED", "FAILED"].includes(test.status) && (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {test.results.map((r) => (
                      <li key={r.id} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
                        <span>{t.has(`checklist.${r.parameter}.name`) ? t(`checklist.${r.parameter}.name`) : r.parameter}</span>
                        <StatusBadge map={CHECK_OUTCOME} value={r.outcome} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}

          {proc?.farmerPayment && (
            <Card>
              <CardHeader title={t("farmer.yourPayment")} />
              <div className="p-5">
                <p className="text-sm text-muted">
                  {formatKg(proc.farmerPayment.quantityGrams)} × {formatINR(proc.farmerPayment.pricePerKgPaise)}/kg
                </p>
                <p className="text-2xl font-bold text-earth-900">{formatINR(proc.farmerPayment.totalAmountPaise)}</p>
                <p className="mt-1 text-sm">
                  {t("farmer.statusLabel")}: <strong>{t(`labels.farmerPaymentStatus.${proc.farmerPayment.status}`)}</strong>
                  {proc.farmerPayment.reference && ` · ${t("farmer.ref")} ${proc.farmerPayment.reference}`}
                </p>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title={t("farmer.yourPhotos")} subtitle={t("farmer.photosNote")} />
            <div className="p-5">
              <MediaGallery media={sub.media} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
