import { Timeline, type TimelineStep } from "@/components/timeline";
import { formatDateTime } from "@/lib/format";
import { getT } from "@/i18n/server";

type OrderLike = {
  status: string;
  placedAt: Date;
  confirmedAt: Date | null;
  packedAt: Date | null;
  shippedAt: Date | null;
  outForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
};

export async function OrderTimeline({ order }: { order: OrderLike }) {
  const t = await getT();
  const stages: Array<[string, Date | null]> = [
    [t("labels.orderStatus.PLACED"), order.placedAt],
    [t("labels.orderStatus.CONFIRMED"), order.confirmedAt],
    [t("labels.orderStatus.PACKED"), order.packedAt],
    [t("labels.orderStatus.SHIPPED"), order.shippedAt],
    [t("labels.orderStatus.OUT_FOR_DELIVERY"), order.outForDeliveryAt],
    [t("labels.orderStatus.DELIVERED"), order.deliveredAt],
  ];
  const firstPending = stages.findIndex(([, d]) => !d);
  const steps: TimelineStep[] = stages.map(([label, d], i) => ({
    label,
    state: d ? "done" : order.status === "CANCELLED" ? "upcoming" : i === firstPending ? "current" : "upcoming",
    detail: d ? formatDateTime(d) : undefined,
  }));
  if (order.status === "CANCELLED") steps.push({ label: t("labels.orderStatus.CANCELLED"), state: "failed", detail: formatDateTime(order.cancelledAt) });
  return <Timeline steps={steps} compact />;
}
