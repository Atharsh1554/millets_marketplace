import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Card, CardHeader, PageHeader, StatusBadge } from "@/components/ui";
import { ActionButton } from "@/components/forms";
import { OrderTimeline } from "@/components/shop/order-timeline";
import { adminCancelOrderAction, advanceOrderAction } from "@/app/actions/operations";
import { requirePageRole } from "@/server/auth/guard";
import { orderDetail } from "@/server/services/shop";
import { formatDateTime, formatINR, formatWeight } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/lib/labels";

const NEXT_LABEL: Record<string, string> = {
  PLACED: "Confirm order",
  CONFIRMED: "Mark packed",
  PACKED: "Mark shipped",
  SHIPPED: "Mark out for delivery",
  OUT_FOR_DELIVERY: "Mark delivered",
};

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requirePageRole(["ADMIN"]);
  const { id } = await params;
  const order = await orderDetail(id);
  if (!order) notFound();
  const next = NEXT_LABEL[order.status];
  const cancellable = ["PLACED", "CONFIRMED", "PACKED"].includes(order.status);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader
        eyebrow={formatDateTime(order.placedAt)}
        title={`Order ${order.code}`}
        subtitle={`${order.user.name} · ${order.user.email}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={ORDER_STATUS} value={order.status} className="px-3 py-1 text-sm" />
            {next && <ActionButton action={advanceOrderAction} fields={{ orderId: order.id }} size="md"><PackageCheck className="size-4" /> {next}</ActionButton>}
            {cancellable && <ActionButton action={adminCancelOrderAction} fields={{ orderId: order.id }} variant="dangerOutline" size="md" confirm="Cancel this order and restore stock?">Cancel</ActionButton>}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Pick list" subtitle="Pick from the listed batch so traceability stays correct." />
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Product</th><th>Batch</th><th>Pack</th><th>Qty</th><th>Unit</th><th>Line total</th></tr>
                </thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td className="font-semibold">{i.productName}</td>
                      <td className="font-mono text-xs">{i.inventory.batch.batchNumber}</td>
                      <td>{formatWeight(i.weightGrams)}</td>
                      <td>{i.quantity}</td>
                      <td>{formatINR(i.unitPricePaise)}</td>
                      <td className="font-semibold">{formatINR(i.lineTotalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <CardHeader title="Ship to" />
            <div className="p-5 text-sm">
              <p className="font-semibold">{order.shipName} · {order.shipPhone}</p>
              <p>{order.shipLine1}{order.shipLine2 && `, ${order.shipLine2}`}</p>
              <p>{order.shipCity}, {order.shipDistrict}, {order.shipState} {order.shipPincode}</p>
              <p className="mt-2 text-muted">Delivery: {order.deliveryMethod === "EXPRESS" ? "Express" : "Standard"}</p>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5"><OrderTimeline order={order} /></Card>
          <Card className="space-y-1 p-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
              <StatusBadge map={PAYMENT_STATUS} value={order.payment?.status} />
            </div>
            {order.payment?.providerRef && <p className="font-mono text-xs text-muted">{order.payment.providerRef}</p>}
            {order.payment?.isMock && <p className="text-xs text-millet-700">Mock payment provider (development)</p>}
            {order.payment?.feePaise ? <p className="text-xs text-muted">Gateway fee {formatINR(order.payment.feePaise)} (recorded as expense)</p> : null}
            <div className="mt-2 space-y-1 border-t border-earth-100 pt-2">
              <div className="flex justify-between"><span>Subtotal (MRP)</span><span>{formatINR(order.subtotalPaise)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>− {formatINR(order.discountPaise)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{formatINR(order.deliveryPaise)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatINR(order.totalPaise)}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
