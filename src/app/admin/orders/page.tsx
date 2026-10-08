import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { cn, formatDateTime, formatINR } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/lib/labels";

const FILTERS = ["", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requirePageRole(["ADMIN"]);
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status in ORDER_STATUS ? (sp.status as OrderStatus) : undefined;
  const orders = await db.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { placedAt: "desc" },
    take: 200,
    include: { user: { select: { name: true } }, payment: true, _count: { select: { items: true } } },
  });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Customer Orders" subtitle="Our organization confirms, packs and ships every order. Farmers never fulfil customer orders." />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((v) => (
          <Link key={v} href={v ? `/admin/orders?status=${v}` : "/admin/orders"} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", (status ?? "") === v ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
            {v ? ORDER_STATUS[v].label : "All"}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders in this view" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Placed</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold text-leaf-700 hover:underline">{o.code}</Link>
                  </td>
                  <td>{o.user.name}</td>
                  <td className="text-xs">{formatDateTime(o.placedAt)}</td>
                  <td>{o._count.items}</td>
                  <td className="font-semibold">{formatINR(o.totalPaise)}</td>
                  <td>
                    <span className="mr-1 text-xs">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</span>
                    <StatusBadge map={PAYMENT_STATUS} value={o.payment?.status} />
                  </td>
                  <td><StatusBadge map={ORDER_STATUS} value={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
