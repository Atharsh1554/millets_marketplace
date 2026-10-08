import Link from "next/link";
import { Heart, IndianRupee, Package, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { Card, CardHeader, EmptyState, LinkButton, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { cartCount, customerOrders } from "@/server/services/shop";
import { formatDate, formatINR } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/labels";
import { getT } from "@/i18n/server";

export default async function CustomerDashboard() {
  const user = await requirePageRole(["CUSTOMER"]);
  const [orders, cart, wishlist, complaints, t] = await Promise.all([
    customerOrders(user.id),
    cartCount(user.id),
    db.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
    db.complaint.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { order: { select: { code: true } } } }),
    getT(),
  ]);
  const active = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const spent = orders.filter((o) => o.status !== "CANCELLED" && o.payment?.status === "SUCCEEDED").reduce((s, o) => s + o.totalPaise, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={t("customer.eyebrow")}
        title={t("customer.welcome", { name: user.name.split(" ")[0] })}
        subtitle={t("customer.subtitle")}
        action={<LinkButton href="/customer/shop"><ShoppingBag className="size-4" /> {t("common.actions.browseProducts")}</LinkButton>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label={t("customer.totalOrders")} value={orders.length} icon={Package} />
        <StatCard label={t("customer.inProgress")} value={active.length} icon={Truck} tone="gold" />
        <StatCard label={t("labels.orderStatus.DELIVERED")} value={delivered.length} icon={PackageCheck} tone="leaf" />
        <StatCard label={t("customer.totalSpent")} value={formatINR(spent)} icon={IndianRupee} tone="earth" />
        <StatCard label={t("customer.cartItems")} value={cart} icon={ShoppingBag} tone="sky" />
        <StatCard label={t("common.navigation.wishlist")} value={wishlist} icon={Heart} tone="red" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title={t("customer.recentOrders")} action={<Link href="/customer/orders" className="text-sm font-semibold text-leaf-700 hover:underline">{t("customer.allOrders")} →</Link>} />
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Package} title={t("orders.none")} action={<LinkButton href="/customer/shop">{t("common.actions.startShopping")}</LinkButton>} />
            </div>
          ) : (
            <ul className="divide-y divide-earth-100">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link href={`/customer/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-cream">
                    <span>
                      <span className="block font-semibold text-earth-900">{o.code}</span>
                      <span className="text-xs text-muted">{formatDate(o.placedAt)} · {t("orders.items", { count: o.items.reduce((s, i) => s + i.quantity, 0) })}</span>
                    </span>
                    <StatusBadge map={ORDER_STATUS} value={o.status} />
                    <span className="font-bold text-earth-900">{formatINR(o.totalPaise)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          {active[0] && (
            <Card>
              <CardHeader title={t("customerNav.tracking")} subtitle={active[0].code} action={<Link href="/customer/tracking" className="text-sm font-semibold text-leaf-700 hover:underline">{t("common.actions.all")} →</Link>} />
              <div className="p-5">
                <OrderTimeline order={active[0]} />
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title={t("customer.myComplaints")} />
            {complaints.length === 0 ? (
              <p className="p-5 text-sm text-muted">{t("customer.noComplaints")}</p>
            ) : (
              <ul className="divide-y divide-earth-100 text-sm">
                {complaints.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <p className="font-semibold text-earth-900">{c.subject}</p>
                    <p className="text-xs text-muted">{c.order?.code} · {t(`labels.complaintStatus.${c.status}`)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
