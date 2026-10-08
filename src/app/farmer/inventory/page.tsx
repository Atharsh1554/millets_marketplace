import { Boxes, Scale, ShoppingBag, Warehouse } from "lucide-react";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { farmerBatches } from "@/server/services/farmer-portal";
import { getT } from "@/i18n/server";
import { formatKg } from "@/lib/format";
import { INVENTORY_STATUS } from "@/lib/labels";

export default async function FarmerInventoryPage() {
  const user = await requirePageRole(["FARMER"]);
  const [all, t] = await Promise.all([farmerBatches(user.farmer!.id), getT()]);
  const batches = all.filter((b) => b.inventory);
  const sum = (k: "quantityReceivedGrams" | "quantityAvailableGrams" | "quantitySoldGrams") => batches.reduce((a, b) => a + (b.inventory?.[k] ?? 0), 0);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("farmer.inventoryTitle")} subtitle={t("farmer.inventorySubtitle")} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label={t("farmer.receivedInventory")} value={formatKg(sum("quantityReceivedGrams"))} icon={Warehouse} tone="earth" />
        <StatCard label={t("farmer.available")} value={formatKg(sum("quantityAvailableGrams"))} icon={Scale} />
        <StatCard label={t("farmer.soldToCustomers")} value={formatKg(sum("quantitySoldGrams"))} icon={ShoppingBag} tone="gold" />
      </div>
      {batches.length === 0 ? (
        <EmptyState icon={Boxes} title={t("farmer.noInventory")}>{t("farmer.noInventoryText")}</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("farmer.colBatch")}</th>
                <th>{t("farmer.colHarvest")}</th>
                <th>{t("farmer.colMillet")}</th>
                <th>{t("farmer.colReceived")}</th>
                <th>{t("farmer.available")}</th>
                <th>{t("farmer.colSold")}</th>
                <th>{t("farmer.colStorage")}</th>
                <th>{t("farmer.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-xs font-semibold">{b.batchNumber}</td>
                  <td>{b.procurement.submission.title}</td>
                  <td>{t(`labels.millet.${b.milletType}`)}</td>
                  <td>{formatKg(b.inventory!.quantityReceivedGrams)}</td>
                  <td className="font-semibold">{formatKg(b.inventory!.quantityAvailableGrams)}</td>
                  <td>{formatKg(b.inventory!.quantitySoldGrams)}</td>
                  <td className="text-xs">{b.inventory!.storageLocation}</td>
                  <td><StatusBadge map={INVENTORY_STATUS} value={b.inventory!.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
