import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { customerOrders } from "@/server/services/shop";
import { formatDate, formatINR } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requirePageRole(["CUSTOMER"], "/customer/orders");
  const [orders, t] = await Promise.all([customerOrders(user.id), getT()]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("customerNav.orders")} subtitle={t("orders.subtitle")} />
      {orders.length === 0 ? (
        <EmptyState icon={Package} title={t("orders.none")} action={<LinkButton href="/customer/shop">{t("common.actions.startShopping")}</LinkButton>} />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/customer/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:shadow-[var(--shadow-lift)]">
                <div>
                  <p className="font-semibold text-earth-900">{o.code}</p>
                  <p className="text-sm text-muted">
                    {formatDate(o.placedAt)} · {t("orders.items", { count: o.items.reduce((s, i) => s + i.quantity, 0) })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge map={ORDER_STATUS} value={o.status} />
                  <StatusBadge map={PAYMENT_STATUS} value={o.payment?.status} />
                </div>
                <p className="font-bold text-earth-900">{formatINR(o.totalPaise)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
