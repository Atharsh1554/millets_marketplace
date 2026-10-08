import Link from "next/link";
import { Hourglass, IndianRupee, Wallet } from "lucide-react";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { listFarmerPayments } from "@/server/services/procurement";
import { farmerStats } from "@/server/services/finance";
import { formatDate, formatINR, formatKg } from "@/lib/format";
import { FARMER_PAYMENT_STATUS } from "@/lib/labels";
import { getT } from "@/i18n/server";

/** Farmer earnings — only the farmer's own amounts. No business expenses or margins are exposed. */
export default async function FarmerPaymentsPage() {
  const user = await requirePageRole(["FARMER"]);
  const farmerId = user.farmer!.id;
  const [payments, stats, t] = await Promise.all([listFarmerPayments(farmerId), farmerStats(farmerId), getT()]);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("farmer.paymentsTitle")} subtitle={t("farmer.paymentsSubtitle")} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label={t("farmer.statEarnings")} value={formatINR(stats.totalEarnings)} icon={IndianRupee} tone="gold" />
        <StatCard label={t("farmer.statPending")} value={formatINR(stats.pendingPayments)} icon={Hourglass} tone="sky" />
        <StatCard label={t("farmer.statCompleted")} value={formatINR(stats.completedPayments)} icon={Wallet} />
      </div>
      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title={t("farmer.noPayments")}>{t("farmer.noPaymentsText")}</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("farmer.colHarvest")}</th>
                <th>{t("farmer.colQtyProcured")}</th>
                <th>{t("farmer.colAgreedPrice")}</th>
                <th>{t("farmer.colTotalAmount")}</th>
                <th>{t("farmer.colPaymentStatus")}</th>
                <th>{t("farmer.colPaymentDate")}</th>
                <th>{t("farmer.colReference")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/farmer/harvests/${p.procurement.submission.id}`} className="font-semibold text-leaf-700 hover:underline">
                      {p.procurement.submission.title}
                    </Link>
                    <p className="text-xs text-muted">{t(`labels.millet.${p.procurement.milletType}`)}</p>
                  </td>
                  <td>{formatKg(p.quantityGrams)}</td>
                  <td>{formatINR(p.pricePerKgPaise)}/kg</td>
                  <td className="font-bold">{formatINR(p.totalAmountPaise)}</td>
                  <td>
                    <StatusBadge map={FARMER_PAYMENT_STATUS} value={p.status} />
                  </td>
                  <td>{formatDate(p.paymentDate)}</td>
                  <td className="font-mono text-xs">{p.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
