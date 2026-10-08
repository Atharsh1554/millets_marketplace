import Link from "next/link";
import { BarChart3, Factory, IndianRupee, Package, PiggyBank, Receipt, Truck, Wallet, CreditCard, Building2, MoreHorizontal } from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { ProfitChart, RevenueCostChart, SimpleBarChart, SERIES } from "@/components/charts";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/forms";
import { addExpenseAction, profitRecordAction } from "@/app/actions/operations";
import { requirePageRole } from "@/server/auth/guard";
import { computeFinancials, lastMonths, monthlySeries, periodRange } from "@/server/services/finance";
import { db } from "@/server/db";
import { cn, formatDate, formatINR } from "@/lib/format";
import { EXPENSE_CATEGORIES, EXPENSE_LABEL, MILLET_SHORT } from "@/lib/labels";

export default async function FinancePage({ searchParams }: PageProps<"/admin/finance">) {
  await requirePageRole(["ADMIN"]);
  const sp = await searchParams;
  const periods = lastMonths(12).reverse();
  const period = typeof sp.period === "string" && periods.includes(sp.period) ? sp.period : "all";
  const range = period === "all" ? undefined : periodRange(period);

  const [f, series, expenses, records] = await Promise.all([
    computeFinancials(range),
    monthlySeries(12),
    db.expense.findMany({ where: range ? { date: { gte: range.from, lt: range.to } } : undefined, orderBy: { date: "desc" }, take: 25, include: { batch: { select: { batchNumber: true } } } }),
    db.profitRecord.findMany({ orderBy: { period: "desc" }, take: 12 }),
  ]);

  const rows: Array<[string, number, boolean]> = [
    ["Gross Revenue", f.grossRevenue, true],
    ["Farmer Payment", -f.farmerPayments, false],
    ["Processing Costs", -f.expenses.PROCESSING, false],
    ["Packaging Costs", -f.expenses.PACKAGING, false],
    ["Transportation Costs", -f.expenses.TRANSPORTATION, false],
    ["Payment Gateway Fees", -f.expenses.PAYMENT_GATEWAY_FEES, false],
    ["Operating Expenses", -f.expenses.OPERATING, false],
    ["Other Expenses", -f.expenses.OTHER, false],
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Revenue & Profit"
        subtitle="Calculated live from orders, farmer payments and recorded expenses — no hardcoded figures."
        action={
          <div className="flex gap-1 overflow-x-auto">
            <PeriodLink active={period === "all"} href="/admin/finance">All time</PeriodLink>
            {periods.slice(0, 4).map((p) => (
              <PeriodLink key={p} active={period === p} href={`/admin/finance?period=${p}`}>
                {new Date(`${p}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
              </PeriodLink>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Revenue" value={formatINR(f.grossRevenue)} icon={IndianRupee} hint={`${f.orders} paid orders`} />
        <StatCard label="Farmer Payments" value={formatINR(f.farmerPayments)} icon={Wallet} tone="gold" hint={`${formatINR(f.farmerPaymentsOutstanding)} outstanding`} />
        <StatCard label="Operating Expenses" value={formatINR(f.expenses.OPERATING)} icon={Building2} tone="earth" />
        <StatCard label="Processing Costs" value={formatINR(f.expenses.PROCESSING)} icon={Factory} tone="earth" />
        <StatCard label="Packaging Costs" value={formatINR(f.expenses.PACKAGING)} icon={Package} tone="earth" />
        <StatCard label="Transportation Costs" value={formatINR(f.expenses.TRANSPORTATION)} icon={Truck} tone="earth" />
        <StatCard label="Payment Fees" value={formatINR(f.expenses.PAYMENT_GATEWAY_FEES)} icon={CreditCard} tone="earth" />
        <StatCard label="Net Profit" value={formatINR(f.netProfit)} icon={PiggyBank} tone={f.netProfit >= 0 ? "leaf" : "red"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader title="Profit calculation" subtitle={period === "all" ? "All time" : period} icon={Receipt} />
          <dl className="divide-y divide-earth-100 px-5 text-sm">
            {rows.map(([label, v, plus]) => (
              <div key={label} className="flex justify-between py-2.5">
                <dt className={plus ? "font-semibold" : "text-earth-700"}>{plus ? "" : "− "}{label}</dt>
                <dd className={plus ? "font-semibold" : "text-earth-700"}>{formatINR(Math.abs(v))}</dd>
              </div>
            ))}
            <div className="flex justify-between py-3 text-base font-bold">
              <dt>= Net Profit</dt>
              <dd className={f.netProfit >= 0 ? "text-leaf-700" : "text-red-700"}>{formatINR(f.netProfit)}</dd>
            </div>
          </dl>
          <p className="px-5 pb-4 text-xs text-muted">
            Revenue counts customer orders whose payment succeeded (COD on delivery). Farmer payments count when a harvest is received (owed whether or not paid yet).
          </p>
        </Card>
        <Card>
          <CardHeader title="Monthly revenue vs costs" icon={BarChart3} />
          <div className="p-4"><RevenueCostChart data={series.monthly} /></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Monthly net profit" />
          <div className="p-4"><ProfitChart data={series.monthly} /></div>
        </Card>
        <Card>
          <CardHeader title="Products sold per month (units)" />
          <div className="p-4"><SimpleBarChart name="Units sold" data={series.monthly.map((m) => ({ label: m.period, value: m.unitsSold }))} /></div>
        </Card>
        <Card>
          <CardHeader title="Millet category performance (revenue, 12 months)" />
          <div className="p-4">
            <SimpleBarChart horizontal name="Revenue" format="inr" height={300} data={series.milletPerformance.map((m) => ({ label: MILLET_SHORT[m.milletType], value: m.revenue }))} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Procurement volume per month (kg)" />
          <div className="p-4"><SimpleBarChart name="Procured" format="kg" color={SERIES.farmer} data={series.monthly.map((m) => ({ label: m.period, value: m.procuredKg }))} /></div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Farmer procurement (kg, 12 months)" />
          <div className="p-4"><SimpleBarChart horizontal name="Procured" format="kg" color={SERIES.farmer} height={280} data={series.farmerProcurement.map((m) => ({ label: m.farmer, value: m.kg }))} /></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Record an expense" />
          <ActionForm action={addExpenseAction} resetOnSuccess className="space-y-3 p-5">
            <SelectField label="Category" name="category" options={EXPENSE_CATEGORIES.map((c) => [c, EXPENSE_LABEL[c]])} />
            <TextField label="Amount (₹)" name="amount" type="number" step="0.01" min="0.01" required />
            <TextField label="Description" name="description" required />
            <TextField label="Date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            <TextField label="Batch number (optional)" name="batchId" placeholder="MM-2026-001" />
            <SubmitButton className="w-full">Add expense</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <CardHeader title="Recent expenses" action={<Link href="/api/admin/reports/expenses" className="text-sm font-semibold text-leaf-700 hover:underline">Export CSV</Link>} />
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Batch</th><th>Amount</th></tr></thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="text-xs">{formatDate(e.date)}</td>
                    <td>{EXPENSE_LABEL[e.category]}</td>
                    <td className="text-xs">{e.description}</td>
                    <td className="font-mono text-xs">{e.batch?.batchNumber ?? "—"}</td>
                    <td className="font-semibold">{formatINR(e.amountPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Saved profit records"
          subtitle="Monthly snapshots (ProfitRecord) generated from live data"
          icon={MoreHorizontal}
          action={
            <ActionForm action={profitRecordAction} className="flex items-center gap-2">
              <select name="period" className="input w-auto py-1.5 text-sm" defaultValue={periods[0]}>
                {periods.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <SubmitButton size="sm">Generate snapshot</SubmitButton>
            </ActionForm>
          }
        />
        {records.length === 0 ? (
          <p className="p-5 text-sm text-muted">No snapshots yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Period</th><th>Revenue</th><th>Farmer</th><th>Processing</th><th>Packaging</th><th>Transport</th><th>Fees</th><th>Operating</th><th>Other</th><th>Net profit</th><th>Generated</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.period}</td>
                    <td>{formatINR(r.grossRevenuePaise)}</td>
                    <td>{formatINR(r.farmerPaymentsPaise)}</td>
                    <td>{formatINR(r.processingPaise)}</td>
                    <td>{formatINR(r.packagingPaise)}</td>
                    <td>{formatINR(r.transportationPaise)}</td>
                    <td>{formatINR(r.paymentFeesPaise)}</td>
                    <td>{formatINR(r.operatingPaise)}</td>
                    <td>{formatINR(r.otherPaise)}</td>
                    <td className={cn("font-bold", r.netProfitPaise < 0 && "text-red-700")}>{formatINR(r.netProfitPaise)}</td>
                    <td className="text-xs">{formatDate(r.generatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PeriodLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", active ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
      {children}
    </Link>
  );
}
