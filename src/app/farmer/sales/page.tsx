import { Package, Scale, ShoppingBag } from "lucide-react";
import { Card, CardHeader, Notice, PageHeader, StatCard } from "@/components/ui";
import { SimpleBarChart } from "@/components/charts";
import { requirePageRole } from "@/server/auth/guard";
import { farmerBatches, farmerOrderItems } from "@/server/services/farmer-portal";
import { lastMonths } from "@/server/services/finance";
import { getT } from "@/i18n/server";
import { formatKg } from "@/lib/format";

/** Sales volume of the farmer's produce. Quantities only — selling prices and margins are not shown to farmers. */
export default async function FarmerSalesPage() {
  const user = await requirePageRole(["FARMER"]);
  const [items, batches, t] = await Promise.all([farmerOrderItems(user.farmer!.id), farmerBatches(user.farmer!.id), getT()]);
  const sold = items.filter((i) => i.order.status !== "CANCELLED");
  const grams = (list: typeof sold) => list.reduce((a, i) => a + i.quantity * i.weightGrams, 0);
  const months = lastMonths(12);
  const monthly = months.map((m) => ({
    label: m,
    value: grams(sold.filter((i) => i.order.placedAt.toISOString().slice(0, 7) === m)) / 1000,
  }));
  const perBatch = batches.filter((b) => b.inventory).map((b) => ({ label: b.batchNumber, value: (b.inventory?.quantitySoldGrams ?? 0) / 1000 }));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("farmer.salesTitle")} subtitle={t("farmer.salesSubtitle")} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label={t("farmer.quantitySold")} value={formatKg(grams(sold))} icon={Scale} />
        <StatCard label={t("farmer.orderLines")} value={sold.length} icon={ShoppingBag} tone="gold" />
        <StatCard label={t("farmer.packsSold")} value={sold.reduce((a, i) => a + i.quantity, 0)} icon={Package} tone="earth" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("farmer.soldPerMonth")} />
          <div className="p-4">
            <SimpleBarChart name={t("farmer.colSold")} format="kg" data={monthly} />
          </div>
        </Card>
        <Card>
          <CardHeader title={t("farmer.soldPerBatch")} />
          <div className="p-4">
            <SimpleBarChart name={t("farmer.colSold")} format="kg" horizontal data={perBatch} height={Math.max(200, perBatch.length * 44)} />
          </div>
        </Card>
      </div>
      <div className="mt-6">
        <Notice tone="info">{t("farmer.salesNote")}</Notice>
      </div>
    </div>
  );
}
