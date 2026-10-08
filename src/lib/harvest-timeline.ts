import type { TimelineStep } from "@/components/timeline";
import type { Translator } from "@/i18n/translate";
import { formatINR, formatKg } from "./format";

const ORDER = [
  "DRAFT",
  "SUBMITTED",
  "ADMIN_REVIEW_PENDING",
  "ADMIN_APPROVED",
  "PHYSICAL_TESTING_PENDING",
  "SAMPLE_COLLECTION_SCHEDULED",
  "SAMPLE_COLLECTED",
  "PHYSICAL_TESTING",
  "PHYSICAL_TEST_PASSED",
  "PROCUREMENT_PENDING",
  "PROCURED",
  "MARKETPLACE_APPROVED",
  "AVAILABLE_FOR_SALE",
  "SOLD_OUT",
];

const idx = (s: string) => ORDER.indexOf(s);

export type TimelineInput = {
  status: string;
  infoRequested: boolean;
  procurement?: { status: string; actualQuantityGrams: number | null; farmerPayment?: { status: string; totalAmountPaise: number } | null } | null;
  soldGrams?: number;
};

/** Farmer-friendly harvest journey: Submitted → Admin Review → Physical Testing → Procurement → Marketplace → Sold → Payment. */
export function harvestTimeline(h: TimelineInput, t: Translator): TimelineStep[] {
  const s = h.status;
  const i = idx(s);
  const rejected = s === "ADMIN_REJECTED";
  const failed = s === "PHYSICAL_TEST_FAILED";
  const stopped = rejected || failed;
  const pay = h.procurement?.farmerPayment;

  const steps: TimelineStep[] = [
    { label: t("timeline.submitted"), state: s === "DRAFT" ? "current" : "done", detail: s === "DRAFT" ? t("timeline.draft") : undefined },
    {
      label: rejected ? t("timeline.reviewRejected") : t("timeline.review"),
      state: rejected ? "failed" : failed || i >= idx("ADMIN_APPROVED") ? "done" : s === "ADMIN_REVIEW_PENDING" ? "current" : "upcoming",
      detail: s === "ADMIN_REVIEW_PENDING" ? (h.infoRequested ? t("timeline.infoRequested") : t("timeline.reviewing")) : rejected ? t("timeline.rejected") : i >= idx("ADMIN_APPROVED") || failed ? t("timeline.approved") : undefined,
    },
    {
      label: failed ? t("timeline.testingFailed") : t("timeline.testing"),
      state: failed ? "failed" : rejected ? "upcoming" : i >= idx("PHYSICAL_TEST_PASSED") ? "done" : i >= idx("ADMIN_APPROVED") ? "current" : "upcoming",
      detail: i >= idx("ADMIN_APPROVED") && i < idx("PHYSICAL_TEST_PASSED") && !stopped ? t(`labels.harvestStatus.${s}`) : i >= idx("PHYSICAL_TEST_PASSED") && !stopped ? t("timeline.testPassed") : undefined,
    },
    {
      label: t("timeline.procurement"),
      state: stopped ? "upcoming" : i >= idx("PROCURED") ? "done" : s === "PROCUREMENT_PENDING" ? "current" : "upcoming",
      detail: h.procurement ? `${t(`labels.procurementStatus.${h.procurement.status}`)}${h.procurement.actualQuantityGrams ? ` · ${formatKg(h.procurement.actualQuantityGrams)}` : ""}` : undefined,
    },
    {
      label: t("timeline.marketplace"),
      state: stopped ? "upcoming" : i >= idx("AVAILABLE_FOR_SALE") ? "done" : s === "PROCURED" || s === "MARKETPLACE_APPROVED" ? "current" : "upcoming",
      detail: i >= idx("AVAILABLE_FOR_SALE") && !stopped ? t("timeline.available") : undefined,
    },
    {
      label: t("timeline.sold"),
      state: s === "SOLD_OUT" ? "done" : s === "AVAILABLE_FOR_SALE" ? "current" : "upcoming",
      detail: h.soldGrams ? t("timeline.soldDetail", { qty: formatKg(h.soldGrams) }) : undefined,
    },
    {
      label: t("timeline.payment"),
      state: pay?.status === "PAID" ? "done" : pay ? (pay.status === "FAILED" ? "failed" : "current") : "upcoming",
      detail: pay ? `${formatINR(pay.totalAmountPaise)} · ${t(`labels.farmerPaymentStatus.${pay.status}`)}` : undefined,
    },
  ];
  return steps;
}

/** Group of harvest statuses → simple columns for tables. */
export function adminStatusOf(status: string, infoRequested: boolean, t: Translator) {
  if (status === "DRAFT") return { label: t("timeline.statusDraft"), tone: "neutral" as const };
  if (status === "ADMIN_REVIEW_PENDING") return infoRequested ? { label: t("timeline.statusInfo"), tone: "gold" as const } : { label: t("timeline.statusPending"), tone: "warning" as const };
  if (status === "ADMIN_REJECTED") return { label: t("timeline.statusRejected"), tone: "danger" as const };
  return { label: t("timeline.statusApproved"), tone: "success" as const };
}
