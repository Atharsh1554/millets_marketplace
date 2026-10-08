import Link from "next/link";
import { Card, CardHeader, Notice, PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { CATEGORIES, CATEGORY_LABEL, MILLET_LABEL, MILLET_TYPES } from "@/lib/labels";

/** Product categories and millet types with live product counts. */
export default async function CategoriesPage() {
  await requirePageRole(["ADMIN"]);
  const [byCat, byMillet] = await Promise.all([
    db.product.groupBy({ by: ["category", "status"], _count: { _all: true } }),
    db.product.groupBy({ by: ["milletType", "status"], _count: { _all: true } }),
  ]);
  const count = (rows: Array<{ _count: { _all: number }; status: string }>, live: boolean) =>
    rows.filter((r) => !live || r.status === "AVAILABLE_FOR_SALE").reduce((a, r) => a + r._count._all, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Categories" subtitle="How the catalog is organised. Customers can filter the shop by category and by millet type." />
      <Notice tone="info">Categories and millet types are fixed lists in the data model so that search, filters and traceability stay consistent. Assign them when creating a listing from inventory.</Notice>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Product categories" />
          <table className="table min-w-0">
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>On sale</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => {
                const rows = byCat.filter((r) => r.category === c);
                return (
                  <tr key={c}>
                    <td>
                      <Link href={`/shop?category=${c}`} className="font-semibold text-leaf-700 hover:underline">{CATEGORY_LABEL[c]}</Link>
                    </td>
                    <td>{count(rows, false)}</td>
                    <td>{count(rows, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardHeader title="Millet types" />
          <table className="table min-w-0">
            <thead>
              <tr>
                <th>Millet</th>
                <th>Products</th>
                <th>On sale</th>
              </tr>
            </thead>
            <tbody>
              {MILLET_TYPES.map((m) => {
                const rows = byMillet.filter((r) => r.milletType === m);
                return (
                  <tr key={m}>
                    <td>
                      <Link href={`/shop?millet=${m}`} className="font-semibold text-leaf-700 hover:underline">{MILLET_LABEL[m]}</Link>
                    </td>
                    <td>{count(rows, false)}</td>
                    <td>{count(rows, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
