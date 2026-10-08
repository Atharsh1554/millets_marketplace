import { Hourglass, IndianRupee, Wallet } from "lucide-react";
import Link from "next/link";
import { Badge, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { listFarmerPayments } from "@/server/services/procurement";
import { db } from "@/server/db";
import { cn, formatDate, formatDateTime, formatINR, formatKg } from "@/lib/format";
import { FARMER_PAYMENT_STATUS, MILLET_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/lib/labels";
import { PaymentUpdater } from "./payment-updater";

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  await requirePageRole(["ADMIN"]);
  const tab = (await searchParams).tab === "customer" ? "customer" : "farmer";
  return (
    <>
      <div className="mx-auto mb-4 flex max-w-7xl gap-2">
        {[
          ["farmer", "Farmer payouts", "/admin/payments"],
          ["customer", "Customer payments", "/admin/payments?tab=customer"],
        ].map(([k, l, href]) => (
          <Link key={k} href={href} className={cn("rounded-full px-4 py-2 text-sm font-semibold", tab === k ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
            {l}
          </Link>
        ))}
      </div>
      {tab === "farmer" ? <FarmerPayouts /> : <CustomerPayments />}
    </>
  );
}

async function CustomerPayments() {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { order: { select: { id: true, code: true, user: { select: { name: true } } } } } });
  const sum = (s: string) => payments.filter((p) => p.status === s).reduce((a, p) => a + p.amountPaise, 0);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Customer Payments" subtitle="Payments received from customers for marketplace orders (latest 200). Separate from farmer payouts." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Succeeded" value={formatINR(sum("SUCCEEDED"))} icon={Wallet} />
        <StatCard label="Pending (COD / processing)" value={formatINR(sum("PENDING"))} icon={Hourglass} tone="gold" />
        <StatCard label="Refunded" value={formatINR(sum("REFUNDED"))} icon={IndianRupee} tone="earth" />
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Gateway fee</th>
              <th>Status</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="text-xs">{formatDateTime(p.createdAt)}</td>
                <td>
                  <Link href={`/admin/orders/${p.order.id}`} className="font-mono text-xs font-semibold text-leaf-700 hover:underline">{p.order.code}</Link>
                </td>
                <td>{p.order.user.name}</td>
                <td>
                  {PAYMENT_METHOD_LABEL[p.method]} {p.isMock && p.method !== "COD" && <Badge tone="gold">Mock</Badge>}
                </td>
                <td className="font-semibold">{formatINR(p.amountPaise)}</td>
                <td>{formatINR(p.feePaise)}</td>
                <td><StatusBadge map={PAYMENT_STATUS} value={p.status} /></td>
                <td className="font-mono text-xs">{p.providerRef ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function FarmerPayouts() {
  const rows = await listFarmerPayments();
  const sum = (s: string[]) => rows.filter((r) => s.includes(r.status)).reduce((a, r) => a + r.totalAmountPaise, 0);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Farmer Payments" subtitle="Farmer amount = actual quantity procured × agreed price per kg. Tracked separately from marketplace sales revenue." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending / processing" value={formatINR(sum(["PENDING", "PROCESSING", "FAILED"]))} icon={Hourglass} tone="gold" />
        <StatCard label="Paid" value={formatINR(sum(["PAID"]))} icon={Wallet} />
        <StatCard label="Total owed to farmers" value={formatINR(sum(["PENDING", "PROCESSING", "PAID", "FAILED"]))} icon={IndianRupee} tone="earth" />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No farmer payments yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Harvest</th>
                <th>Approved Qty</th>
                <th>Actual Procured</th>
                <th>Price/kg</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Paid on / Ref</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.farmer.user.name}</td>
                  <td>
                    {p.procurement.submission.title}
                    <p className="text-xs text-muted">{p.procurement.code} · {MILLET_LABEL[p.procurement.milletType]}</p>
                  </td>
                  <td>{formatKg(p.approvedQuantityGrams)}</td>
                  <td>{formatKg(p.quantityGrams)}</td>
                  <td>{formatINR(p.pricePerKgPaise)}</td>
                  <td className="font-bold">{formatINR(p.totalAmountPaise)}</td>
                  <td><StatusBadge map={FARMER_PAYMENT_STATUS} value={p.status} /></td>
                  <td className="text-xs">
                    {formatDate(p.paymentDate)}
                    {p.reference && <p className="font-mono">{p.reference}</p>}
                  </td>
                  <td>{p.status !== "PAID" ? <PaymentUpdater paymentId={p.id} status={p.status} /> : <span className="text-xs text-muted">Completed</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
