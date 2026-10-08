import Link from "next/link";
import { ScrollText } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { cn, formatDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";

const PAGE = 100;

export default async function AuditLogsPage({ searchParams }: PageProps<"/admin/audit-logs">) {
  await requirePageRole(["ADMIN"]);
  const sp = await searchParams;
  const role = typeof sp.role === "string" && sp.role in ROLE_LABEL ? sp.role : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = role ? { actorRole: role } : undefined;
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { actor: { select: { name: true, email: true } } } }),
    db.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => `/admin/audit-logs?${new URLSearchParams({ ...(role ? { role } : {}), page: String(p) })}`;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Audit Logs" subtitle={`${total} recorded actions. Every successful state-changing action is logged with who did it and when. Passwords and free-text are never recorded.`} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["", "ADMIN", "QUALITY_TEAM", "FARMER", "CUSTOMER"].map((v) => (
          <Link key={v} href={v ? `/admin/audit-logs?role=${v}` : "/admin/audit-logs"} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", (role ?? "") === v ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
            {v ? ROLE_LABEL[v] : "All roles"}
          </Link>
        ))}
      </div>
      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit entries yet">Entries appear as people use the app.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="text-xs whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                  <td>
                    {l.actor?.name ?? "—"}
                    <p className="text-xs text-muted">{l.actor?.email}</p>
                  </td>
                  <td className="text-xs">{l.actorRole ? ROLE_LABEL[l.actorRole] : "—"}</td>
                  <td className="font-semibold">{l.action}</td>
                  <td className="font-mono text-xs">{l.entity ? `${l.entity}:${l.entityId?.slice(-8)}` : "—"}</td>
                  <td className="text-xs">{l.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={href(page - 1)} className="font-semibold text-leaf-700 hover:underline">← Newer</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link href={href(page + 1)} className="font-semibold text-leaf-700 hover:underline">Older →</Link>}
        </div>
      )}
    </div>
  );
}
