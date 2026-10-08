import { ShoppingCart } from "lucide-react";
import { EmptyState, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { farmerOrderItems } from "@/server/services/farmer-portal";
import { getT } from "@/i18n/server";
import { formatDate, formatKg, formatWeight } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/labels";

export default async function FarmerOrdersPage() {
  const user = await requirePageRole(["FARMER"]);
  const [items, t] = await Promise.all([farmerOrderItems(user.farmer!.id), getT()]);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("farmer.ordersTitle")} subtitle={t("farmer.ordersSubtitle")} />
      <div className="mb-4">
        <Notice tone="info">{t("farmer.ordersNote")}</Notice>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={t("farmer.noOrders")} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("farmer.colOrder")}</th>
                <th>{t("farmer.colDate")}</th>
                <th>{t("farmer.colProduct")}</th>
                <th>{t("farmer.colBatch")}</th>
                <th>{t("farmer.colQuantity")}</th>
                <th>{t("farmer.colDestination")}</th>
                <th>{t("farmer.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="font-mono text-xs font-semibold">{i.order.code}</td>
                  <td>{formatDate(i.order.placedAt)}</td>
                  <td>{i.productName}</td>
                  <td className="font-mono text-xs">{i.inventory.batch.batchNumber}</td>
                  <td>
                    {i.quantity} × {formatWeight(i.weightGrams)}
                    <p className="text-xs text-muted">{formatKg(i.quantity * i.weightGrams)}</p>
                  </td>
                  <td>{i.order.shipCity}, {i.order.shipState}</td>
                  <td><StatusBadge map={ORDER_STATUS} value={i.order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
