import type { ComplaintStatus } from "@prisma/client";
import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";
import { Badge, DemoBadge, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { cn, formatDateTime } from "@/lib/format";
import { ComplaintUpdater } from "./complaint-updater";

const TONE = { OPEN: "warning", IN_PROGRESS: "info", RESOLVED: "success", CLOSED: "neutral" } as const;

export default async function ComplaintsPage({ searchParams }: PageProps<"/admin/complaints">) {
  await requirePageRole(["ADMIN"]);
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status in TONE ? (sp.status as ComplaintStatus) : undefined;
  const [complaints, counts] = await Promise.all([
    db.complaint.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, order: { select: { id: true, code: true } } },
    }),
    db.complaint.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count._all ?? 0;
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Complaints" subtitle="Issues raised by customers on their orders. Customers are notified of every update." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open" value={c("OPEN")} icon={MessageSquareWarning} tone="gold" />
        <StatCard label="In progress" value={c("IN_PROGRESS")} icon={MessageSquareWarning} tone="sky" />
        <StatCard label="Resolved" value={c("RESOLVED")} icon={MessageSquareWarning} />
        <StatCard label="Closed" value={c("CLOSED")} icon={MessageSquareWarning} tone="earth" />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((v) => (
          <Link key={v} href={v ? `/admin/complaints?status=${v}` : "/admin/complaints"} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", (status ?? "") === v ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
            {v ? v.replace("_", " ").toLowerCase().replace(/^\w/, (x) => x.toUpperCase()) : "All"}
          </Link>
        ))}
      </div>
      {complaints.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="No complaints in this view" />
      ) : (
        <ul className="space-y-3">
          {complaints.map((x) => (
            <li key={x.id} className="card grid gap-4 p-5 lg:grid-cols-[1fr_300px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-earth-900">{x.subject}</p>
                  <Badge tone={TONE[x.status]}>{x.status.replace("_", " ")}</Badge>
                  {x.isDemo && <DemoBadge />}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {x.user.name} ({x.user.email}) · {formatDateTime(x.createdAt)}
                  {x.order && (
                    <>
                      {" · "}
                      <Link href={`/admin/orders/${x.order.id}`} className="font-semibold text-leaf-700 hover:underline">{x.order.code}</Link>
                    </>
                  )}
                </p>
                <p className="mt-2 text-sm text-earth-800">{x.message}</p>
                {x.resolution && <p className="mt-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm text-leaf-800">Resolution: {x.resolution}</p>}
              </div>
              {x.status !== "CLOSED" && <ComplaintUpdater complaintId={x.id} current={x.status} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
