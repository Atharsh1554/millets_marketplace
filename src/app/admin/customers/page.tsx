import { Users } from "lucide-react";
import { DemoBadge, EmptyState, PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { formatDate, formatINR } from "@/lib/format";

export default async function CustomersPage() {
  await requirePageRole(["ADMIN"]);
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isDemo: true,
      createdAt: true,
      orders: { select: { totalPaise: true, status: true, placedAt: true, payment: { select: { status: true } } } },
      _count: { select: { reviews: true, complaints: true } },
    },
  });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Customers" subtitle={`${customers.length} customer accounts`} />
      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Last order</th>
                <th>Reviews</th>
                <th>Complaints</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const valid = c.orders.filter((o) => o.status !== "CANCELLED");
                const spent = valid.filter((o) => o.payment?.status === "SUCCEEDED").reduce((a, o) => a + o.totalPaise, 0);
                const last = c.orders.reduce<Date | null>((m, o) => (!m || o.placedAt > m ? o.placedAt : m), null);
                return (
                  <tr key={c.id}>
                    <td className="font-semibold">
                      {c.name} {c.isDemo && <DemoBadge />}
                    </td>
                    <td className="text-xs">
                      {c.email}
                      <p className="text-muted">{c.phone ?? "—"}</p>
                    </td>
                    <td className="text-xs">{formatDate(c.createdAt)}</td>
                    <td>{valid.length}</td>
                    <td className="font-semibold">{formatINR(spent)}</td>
                    <td className="text-xs">{formatDate(last)}</td>
                    <td>{c._count.reviews}</td>
                    <td>{c._count.complaints}</td>
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
