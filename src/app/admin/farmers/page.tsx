import { Users } from "lucide-react";
import { DemoBadge, EmptyState, PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { listFarmers } from "@/server/services/accounts";
import { formatINR, formatKg } from "@/lib/format";

export default async function FarmersPage() {
  await requirePageRole(["ADMIN"]);
  const farmers = await listFarmers();
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Farmers" subtitle={`${farmers.length} registered farmers`} />
      {farmers.length === 0 ? (
        <EmptyState icon={Users} title="No farmers yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Submissions</th>
                <th>Rejected / Failed</th>
                <th>Procured</th>
                <th>Paid</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => {
                const subs = f.submissions.filter((s) => s.status !== "DRAFT").length;
                const bad = f.submissions.filter((s) => ["ADMIN_REJECTED", "PHYSICAL_TEST_FAILED"].includes(s.status)).length;
                const procured = f.procurements.reduce((a, p) => a + (p.actualQuantityGrams ?? 0), 0);
                const paid = f.payments.filter((p) => p.status === "PAID").reduce((a, p) => a + p.totalAmountPaise, 0);
                const owed = f.payments.filter((p) => p.status !== "PAID").reduce((a, p) => a + p.totalAmountPaise, 0);
                return (
                  <tr key={f.id}>
                    <td className="font-semibold">
                      {f.user.name} {f.user.isDemo && <DemoBadge />}
                    </td>
                    <td className="text-xs">
                      {f.user.phone}
                      <p className="text-muted">{f.user.email}</p>
                    </td>
                    <td>{f.village}, {f.district}, {f.state}</td>
                    <td>{subs}</td>
                    <td>{bad}</td>
                    <td>{formatKg(procured)}</td>
                    <td>{formatINR(paid)}</td>
                    <td className={owed ? "font-semibold text-millet-700" : ""}>{formatINR(owed)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
