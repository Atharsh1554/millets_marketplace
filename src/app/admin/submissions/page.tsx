import Link from "next/link";
import type { HarvestStatus } from "@prisma/client";
import { ClipboardList } from "lucide-react";
import { Badge, DemoBadge, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { cn, formatDate, formatINR, formatKg } from "@/lib/format";
import { HARVEST_STATUS, MILLET_LABEL } from "@/lib/labels";

const FILTERS: Array<[string, string]> = [
  ["", "All"],
  ["ADMIN_REVIEW_PENDING", "Pending review"],
  ["PHYSICAL_TESTING_PENDING", "Testing pending"],
  ["PHYSICAL_TESTING", "In testing"],
  ["PROCUREMENT_PENDING", "Procurement pending"],
  ["AVAILABLE_FOR_SALE", "On sale"],
  ["ADMIN_REJECTED", "Rejected"],
  ["PHYSICAL_TEST_FAILED", "Test failed"],
];

export default async function SubmissionsPage({ searchParams }: PageProps<"/admin/submissions">) {
  await requirePageRole(["ADMIN"]);
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status in HARVEST_STATUS ? (sp.status as HarvestStatus) : undefined;
  const rows = await db.harvestSubmission.findMany({
    where: { status: status ?? { not: "DRAFT" } },
    orderBy: { submittedAt: "desc" },
    include: { farmer: { include: { user: { select: { name: true } } } } },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Harvest Submissions" subtitle="Online admin review of farmer submissions. Accepting a submission sends it to the quality team for direct physical testing." />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([v, l]) => (
          <Link key={v} href={v ? `/admin/submissions?status=${v}` : "/admin/submissions"} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap", (status ?? "") === v ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
            {l}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No submissions in this view" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Millet Type</th>
                <th>Quantity</th>
                <th>Harvest Date</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <p className="font-semibold">{r.farmer.user.name} {r.isDemo && <DemoBadge />}</p>
                    <p className="text-xs text-muted">{r.code} · {r.title}</p>
                  </td>
                  <td>{MILLET_LABEL[r.milletType]}</td>
                  <td>
                    {formatKg(r.quantityGrams)}
                    <p className="text-xs text-muted">{formatINR(r.expectedPricePerKgPaise)}/kg</p>
                  </td>
                  <td>{formatDate(r.harvestDate)}</td>
                  <td>{r.district}, {r.state}</td>
                  <td>{formatDate(r.submittedAt)}</td>
                  <td>
                    <StatusBadge map={HARVEST_STATUS} value={r.status} />
                    {r.infoRequested && <Badge tone="gold" className="mt-1">Info requested</Badge>}
                  </td>
                  <td>
                    <Link href={`/admin/submissions/${r.id}`} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap", r.status === "ADMIN_REVIEW_PENDING" && !r.infoRequested ? "bg-leaf-700 text-white hover:bg-leaf-800" : "bg-cream text-earth-800 ring-1 ring-earth-100")}>
                      {r.status === "ADMIN_REVIEW_PENDING" && !r.infoRequested ? "Review" : "View"}
                    </Link>
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
