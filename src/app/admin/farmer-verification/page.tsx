import type { FarmerVerificationStatus } from "@prisma/client";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import { Badge, DemoBadge, EmptyState, PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { cn, formatDate } from "@/lib/format";
import { VerificationForm } from "./verification-form";

const TONE = { PENDING: "warning", VERIFIED: "success", REJECTED: "danger" } as const;

export default async function FarmerVerificationPage({ searchParams }: PageProps<"/admin/farmer-verification">) {
  await requirePageRole(["ADMIN"]);
  const sp = (await searchParams).status;
  const status = sp === "VERIFIED" || sp === "REJECTED" || sp === "ALL" ? sp : "PENDING";
  const farmers = await db.farmer.findMany({
    where: status === "ALL" ? undefined : { verificationStatus: status as FarmerVerificationStatus },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, phone: true, isDemo: true } }, _count: { select: { submissions: true } } },
  });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Farmer Verification" subtitle="Verify new farmer accounts (identity, contact and farm location). Farmers are notified of the decision." />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["PENDING", "VERIFIED", "REJECTED", "ALL"].map((v) => (
          <Link key={v} href={`/admin/farmer-verification?status=${v}`} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", status === v ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
            {v === "ALL" ? "All" : v.charAt(0) + v.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>
      {farmers.length === 0 ? (
        <EmptyState icon={UserCheck} title="No farmers in this view" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Contact</th>
                <th>Farm location</th>
                <th>UPI ID</th>
                <th>Registered</th>
                <th>Submissions</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f.id}>
                  <td className="font-semibold">
                    {f.user.name} {f.user.isDemo && <DemoBadge />}
                  </td>
                  <td className="text-xs">
                    {f.user.phone}
                    <p className="text-muted">{f.user.email}</p>
                  </td>
                  <td className="text-xs">
                    {f.village}, {f.district}, {f.state}
                    {f.farmLocation && <p className="text-muted">{f.farmLocation}</p>}
                  </td>
                  <td className="font-mono text-xs">{f.upiId ?? "—"}</td>
                  <td className="text-xs">{formatDate(f.createdAt)}</td>
                  <td>{f._count.submissions}</td>
                  <td>
                    <Badge tone={TONE[f.verificationStatus]}>{f.verificationStatus}</Badge>
                    {f.verificationNote && <p className="mt-1 max-w-48 text-xs text-muted">{f.verificationNote}</p>}
                  </td>
                  <td>
                    <VerificationForm farmerId={f.id} current={f.verificationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
