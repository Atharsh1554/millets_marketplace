import { Card, CardHeader, Notice, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { Ban, CheckCircle2, ClipboardCheck, Package, PackageCheck, Truck } from "lucide-react";
import { requirePageRole } from "@/server/auth/guard";
import { farmerOrderItems } from "@/server/services/farmer-portal";
import { getT } from "@/i18n/server";
import { formatDate, formatKg } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/labels";

const STAGES = [
  { status: "PLACED", key: "PLACED", icon: Package },
  { status: "CONFIRMED", key: "CONFIRMED", icon: ClipboardCheck },
  { status: "PACKED", key: "PACKED", icon: PackageCheck },
  { status: "SHIPPED", key: "SHIPPED", icon: Truck, also: "OUT_FOR_DELIVERY" },
  { status: "DELIVERED", key: "DELIVERED", icon: CheckCircle2 },
  { status: "CANCELLED", key: "CANCELLED", icon: Ban },
] as const;

/** Read-only processing pipeline for orders containing the farmer's produce. Fulfilment is done by our team. */
export default async function OrderProcessingPage() {
  const user = await requirePageRole(["FARMER"]);
  const [items, t] = await Promise.all([farmerOrderItems(user.farmer!.id), getT()]);
  const inStage = (s: (typeof STAGES)[number]) => items.filter((i) => i.order.status === s.status || ("also" in s && i.order.status === s.also));
  const open = items.filter((i) => !["DELIVERED", "CANCELLED"].includes(i.order.status));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("farmer.processingTitle")} subtitle={t("farmer.processingSubtitle")} />
      <div className="mb-6">
        <Notice tone="info">{t("farmer.processingNote")}</Notice>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((s) => {
          const rows = inStage(s);
          return (
            <StatCard
              key={s.status}
              label={t(`farmer.stage.${s.key}`)}
              value={rows.length}
              icon={s.icon}
              hint={formatKg(rows.reduce((a, i) => a + i.quantity * i.weightGrams, 0))}
              tone={s.status === "CANCELLED" ? "red" : s.status === "DELIVERED" ? "leaf" : "gold"}
            />
          );
        })}
      </div>
      <Card className="mt-6">
        <CardHeader title={t("farmer.openOrders")} subtitle={t("farmer.inProgress", { count: open.length })} />
        {open.length === 0 ? (
          <p className="p-5 text-sm text-muted">{t("farmer.noOpenOrders")}</p>
        ) : (
          <ul className="divide-y divide-earth-100">
            {open.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  <span className="font-mono text-xs font-semibold">{i.order.code}</span> · {i.productName} × {i.quantity}
                  <span className="block text-xs text-muted">{formatDate(i.order.placedAt)} · {i.order.shipCity}</span>
                </span>
                <StatusBadge map={ORDER_STATUS} value={i.order.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
