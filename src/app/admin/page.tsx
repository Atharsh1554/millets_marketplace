import Link from "next/link";
import {
  BadgeCheck,
  ClipboardList,
  FlaskConical,
  IndianRupee,
  Package,
  PiggyBank,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  XCircle,
  CheckCircle2,
  Hourglass,
  Ban,
} from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { RevenueCostChart } from "@/components/charts";
import { adminOverviewStats, monthlySeries } from "@/server/services/finance";
import { db } from "@/server/db";
import { formatDate, formatINR, formatKg } from "@/lib/format";
import { HARVEST_STATUS, INVENTORY_STATUS, PROCUREMENT_STATUS } from "@/lib/labels";

export default async function AdminOverview() {
  const [s, series, pending, lowStock, procPending] = await Promise.all([
    adminOverviewStats(),
    monthlySeries(12),
    db.harvestSubmission.findMany({ where: { status: "ADMIN_REVIEW_PENDING" }, orderBy: { submittedAt: "asc" }, take: 6 }),
    db.inventory.findMany({ where: { status: { in: ["LOW_STOCK", "OUT_OF_STOCK"] } }, include: { batch: true }, take: 6 }),
    db.procurement.findMany({ where: { status: { in: ["PROCUREMENT_PENDING", "COLLECTION_SCHEDULED", "COLLECTED", "RECEIVED"] } }, include: { submission: true }, take: 6 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Admin" title="Overview" subtitle="Farmer sourcing, physical testing, procurement, marketplace and finance at a glance." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Farmers" value={s.farmers} icon={Users} tone="earth" />
        <StatCard label="Pending Submissions" value={s.pendingSubmissions} icon={ClipboardList} tone="gold" />
        <StatCard label="Admin Approved" value={s.adminApproved} icon={BadgeCheck} tone="sky" />
        <StatCard label="Admin Rejected" value={s.adminRejected} icon={Ban} tone="red" />
        <StatCard label="Physical Tests Pending" value={s.testsPending} icon={Hourglass} tone="gold" />
        <StatCard label="Physical Tests Passed" value={s.testsPassed} icon={CheckCircle2} />
        <StatCard label="Physical Tests Failed" value={s.testsFailed} icon={XCircle} tone="red" />
        <StatCard label="Harvests Procured" value={s.procured} icon={Truck} tone="earth" />
        <StatCard label="Total Inventory" value={formatKg(s.inventoryGrams)} icon={Warehouse} tone="earth" />
        <StatCard label="Orders" value={s.orders} icon={ShoppingCart} tone="sky" />
        <StatCard label="Revenue" value={formatINR(s.revenue)} icon={IndianRupee} />
        <StatCard label="Farmer Payments" value={formatINR(s.farmerPayments)} icon={Wallet} tone="gold" />
        <StatCard label="Net Profit" value={formatINR(s.netProfit)} icon={PiggyBank} tone={s.netProfit >= 0 ? "leaf" : "red"} hint="All time, after actual expenses" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Revenue vs costs — last 12 months" subtitle="Revenue from paid customer orders; farmer payments by procurement date; recorded expenses" action={<Link href="/admin/finance" className="text-sm font-semibold text-leaf-700 hover:underline">Finance →</Link>} />
        <div className="p-4">
          <RevenueCostChart data={series.monthly} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Queue title="Waiting for admin review" icon={ClipboardList} href="/admin/submissions?status=ADMIN_REVIEW_PENDING" empty="No submissions waiting.">
          {pending.map((p) => (
            <QueueRow key={p.id} href={`/admin/submissions/${p.id}`} title={p.title} sub={`${p.contactName} · ${formatKg(p.quantityGrams)} · ${formatDate(p.submittedAt)}`} badge={<StatusBadge map={HARVEST_STATUS} value={p.status} />} />
          ))}
        </Queue>
        <Queue title="Procurement in progress" icon={Truck} href="/admin/procurement" empty="Nothing to procure.">
          {procPending.map((p) => (
            <QueueRow key={p.id} href={`/admin/procurement/${p.id}`} title={p.submission.title} sub={`${p.code} · ${formatKg(p.approvedQuantityGrams)}`} badge={<StatusBadge map={PROCUREMENT_STATUS} value={p.status} />} />
          ))}
        </Queue>
        <Queue title="Low / out of stock" icon={Package} href="/admin/inventory" empty="All lots well stocked.">
          {lowStock.map((i) => (
            <QueueRow key={i.id} href={`/admin/inventory/${i.id}`} title={i.batch.batchNumber} sub={`${formatKg(i.quantityAvailableGrams)} available`} badge={<StatusBadge map={INVENTORY_STATUS} value={i.status} />} />
          ))}
        </Queue>
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-muted">
        <FlaskConical className="size-4" /> Quality is verified only by online admin review + direct physical testing by the quality team. There is no automated/AI grading.
      </p>
    </div>
  );
}

function Queue({ title, icon, href, empty, children }: { title: string; icon: typeof Users; href: string; empty: string; children: React.ReactNode[] }) {
  return (
    <Card>
      <CardHeader title={title} icon={icon} action={<Link href={href} className="text-sm font-semibold text-leaf-700 hover:underline">All →</Link>} />
      <ul className="divide-y divide-earth-100">{children.length ? children : <li className="p-5 text-sm text-muted">{empty}</li>}</ul>
    </Card>
  );
}

function QueueRow({ href, title, sub, badge }: { href: string; title: string; sub: string; badge: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-cream">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-earth-900">{title}</span>
          <span className="block truncate text-xs text-muted">{sub}</span>
        </span>
        {badge}
      </Link>
    </li>
  );
}
