import Link from "next/link";
import { Layers } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { farmerBatches } from "@/server/services/farmer-portal";
import { getT } from "@/i18n/server";
import { formatDate, formatKg } from "@/lib/format";
import { PROCUREMENT_STATUS } from "@/lib/labels";

export default async function FarmerBatchesPage() {
  const user = await requirePageRole(["FARMER"]);
  const [batches, t] = await Promise.all([farmerBatches(user.farmer!.id), getT()]);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("farmer.batchesTitle")} subtitle={t("farmer.batchesSubtitle")} />
      {batches.length === 0 ? (
        <EmptyState icon={Layers} title={t("farmer.noBatches")}>{t("farmer.noBatchesText")}</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("farmer.colBatch")}</th>
                <th>{t("farmer.colHarvest")}</th>
                <th>{t("farmer.colMillet")}</th>
                <th>{t("farmer.colHarvestYear")}</th>
                <th>{t("farmer.colTest")}</th>
                <th>{t("farmer.colProcured")}</th>
                <th>{t("farmer.colReceived")}</th>
                <th>{t("farmer.colProducts")}</th>
                <th>{t("farmer.colProcurement")}</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-xs font-semibold">{b.batchNumber}</td>
                  <td>
                    <Link href={`/farmer/harvests/${b.procurement.submission.id}`} className="font-semibold text-leaf-700 hover:underline">{b.procurement.submission.title}</Link>
                    <p className="text-xs text-muted">{b.procurement.submission.code}</p>
                  </td>
                  <td>{t(`labels.millet.${b.milletType}`)}</td>
                  <td>{b.harvestYear}</td>
                  <td className="text-xs">
                    {t("farmer.passedCode", { code: b.procurement.submission.physicalTest?.code ?? "" })}
                    <p className="text-muted">{formatDate(b.procurement.submission.physicalTest?.testDate)}</p>
                  </td>
                  <td>{formatKg(b.procurement.actualQuantityGrams)}</td>
                  <td>{formatDate(b.procurement.receivedDate)}</td>
                  <td className="text-xs">{b.inventory?.products.map((p) => p.name).join(", ") || "—"}</td>
                  <td><StatusBadge map={PROCUREMENT_STATUS} value={b.procurement.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
