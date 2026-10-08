import Link from "next/link";
import { Truck } from "lucide-react";
import { Card, CardHeader, EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { requirePageRole } from "@/server/auth/guard";
import { customerOrders } from "@/server/services/shop";
import { formatDate, formatINR } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/labels";
import { getT } from "@/i18n/server";

export default async function TrackingPage() {
  const user = await requirePageRole(["CUSTOMER"]);
  const [all, t] = await Promise.all([customerOrders(user.id), getT()]);
  const orders = all.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("customerNav.tracking")} subtitle={t("customer.trackingSubtitle")} />
      {orders.length === 0 ? (
        <EmptyState icon={Truck} title={t("customer.nothingInTransit")} action={<LinkButton href="/customer/orders" variant="outline">{t("customer.viewAllOrders")}</LinkButton>}>
          {t("customer.nothingInTransitText")}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardHeader
                title={<Link href={`/customer/orders/${o.id}`} className="hover:underline">{o.code}</Link>}
                subtitle={`${formatDate(o.placedAt)} · ${formatINR(o.totalPaise)}`}
                action={<StatusBadge map={ORDER_STATUS} value={o.status} />}
              />
              <div className="p-5">
                <OrderTimeline order={o} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
