import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { Badge, Card, CardHeader, Notice, StatusBadge } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { cancelMyOrderAction } from "@/app/actions/shop";
import { requirePageRole } from "@/server/auth/guard";
import { orderDetail } from "@/server/services/shop";
import { db } from "@/server/db";
import { ComplaintForm } from "@/components/account/account-forms";
import { formatDateTime, formatINR, formatWeight } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderPage({ params, searchParams }: PageProps<"/customer/orders/[id]">) {
  const user = await requirePageRole(["CUSTOMER"], "/customer/orders");
  const { id } = await params;
  const placed = (await searchParams).placed === "1";
  const [order, t] = await Promise.all([orderDetail(id), getT()]);
  // Customers can only see their own orders (no IDOR).
  if (!order || order.userId !== user.id) notFound();
  const complaints = await db.complaint.findMany({ where: { orderId: order.id, userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-5xl">
      {placed && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-leaf-700 p-5 text-white">
          <CheckCircle2 className="size-7 shrink-0 text-millet-300" />
          <div>
            <p className="text-lg font-semibold">{t("orders.placedTitle", { code: order.code })}</p>
            <p className="text-sm text-leaf-100">
              {t("orders.placedText")}
              {order.payment?.isMock && order.paymentMethod !== "COD" && ` ${t("orders.simulated")}`}
            </p>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-earth-900">{t("orders.orderTitle", { code: order.code })}</h1>
          <p className="text-sm text-muted">{t("orders.placedOn", { date: formatDateTime(order.placedAt) })}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge map={ORDER_STATUS} value={order.status} />
          {order.status === "PLACED" && (
            <ActionButton action={cancelMyOrderAction} fields={{ orderId: order.id }} variant="dangerOutline" confirm={t("orders.cancelConfirm")}>
              {t("orders.cancel")}
            </ActionButton>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={t("orders.itemsTitle")} />
            <ul className="divide-y divide-earth-100">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 p-4">
                  <img src={i.product.images[0]?.url} alt="" className="size-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/customer/shop/${i.product.slug}`} className="font-semibold text-earth-900 hover:text-leaf-700">
                      {i.productName}
                    </Link>
                    <p className="text-xs text-muted">
                      {formatWeight(i.weightGrams)} × {i.quantity} · {t("trace.batch")} {i.inventory.batch.batchNumber}
                    </p>
                    {order.status === "DELIVERED" && (
                      <Link href={`/customer/shop/${i.product.slug}#reviews`} className="text-xs font-semibold text-leaf-700 hover:underline">
                        {t("product.writeReview")} →
                      </Link>
                    )}
                  </div>
                  <p className="font-semibold">{formatINR(i.lineTotalPaise)}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title={t("orders.shippingTo")} />
            <div className="p-5 text-sm text-earth-800">
              <p className="font-semibold">{order.shipName}</p>
              <p>
                {order.shipLine1}
                {order.shipLine2 && `, ${order.shipLine2}`}
              </p>
              <p>
                {order.shipCity}, {order.shipDistrict}, {order.shipState} {order.shipPincode}
              </p>
              <p className="text-muted">{order.shipPhone}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title={t("orders.helpTitle")} subtitle={t("orders.helpText")} />
            <div className="space-y-4 p-5">
              {complaints.map((c) => (
                <div key={c.id} className="rounded-xl bg-cream p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-earth-900">{c.subject}</p>
                    <Badge tone={c.status === "RESOLVED" || c.status === "CLOSED" ? "success" : c.status === "IN_PROGRESS" ? "info" : "warning"}>{t(`labels.complaintStatus.${c.status}`)}</Badge>
                  </div>
                  <p className="mt-1 text-earth-700">{c.message}</p>
                  {c.resolution && <p className="mt-1 text-xs text-leaf-800">{t("orders.ourReply")}: {c.resolution}</p>}
                  <p className="mt-1 text-[11px] text-muted">{formatDateTime(c.createdAt)}</p>
                </div>
              ))}
              <ComplaintForm orderId={order.id} />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-earth-900">{t("customerNav.tracking")}</h2>
            <OrderTimeline order={order} />
          </Card>
          <Card className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold text-earth-900">{t("checkout.stepPayment")}</h2>
            <div className="flex items-center justify-between">
              <span>{t(`labels.paymentMethod.${order.paymentMethod}`)}</span>
              <StatusBadge map={PAYMENT_STATUS} value={order.payment?.status} />
            </div>
            {order.payment?.isMock && (
              <Badge tone="gold">
                <FlaskConical className="size-3" /> {t("orders.mockPayment")}
              </Badge>
            )}
            <div className="space-y-1 border-t border-earth-100 pt-2">
              <div className="flex justify-between"><span className="text-muted">{t("cart.subtotal")}</span><span>{formatINR(order.subtotalPaise)}</span></div>
              <div className="flex justify-between text-leaf-700"><span>{t("cart.discount")}</span><span>− {formatINR(order.discountPaise)}</span></div>
              <div className="flex justify-between"><span className="text-muted">{t("cart.delivery")}</span><span>{order.deliveryPaise ? formatINR(order.deliveryPaise) : t("common.misc.free")}</span></div>
              <div className="flex justify-between font-bold text-earth-900"><span>{t("common.misc.total")}</span><span>{formatINR(order.totalPaise)}</span></div>
            </div>
          </Card>
          {order.status === "PLACED" && <Notice tone="info">{t("orders.cancelNote")}</Notice>}
        </div>
      </div>
    </div>
  );
}
