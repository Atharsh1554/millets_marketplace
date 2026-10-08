import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui";
import { adminStatusOf } from "@/lib/harvest-timeline";
import { formatDate, formatKg } from "@/lib/format";
import { FARMER_PAYMENT_STATUS, PROCUREMENT_STATUS, TEST_STATUS } from "@/lib/labels";
import type { farmerSubmissions } from "@/server/services/harvest";
import { getT } from "@/i18n/server";

type Row = Awaited<ReturnType<typeof farmerSubmissions>>[number];

export async function SubmissionsTable({ rows }: { rows: Row[] }) {
  const t = await getT();
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{t("farmer.colHarvest")}</th>
            <th>{t("farmer.colMillet")}</th>
            <th>{t("farmer.colQuantity")}</th>
            <th>{t("farmer.colSubmitted")}</th>
            <th>{t("farmer.colAdmin")}</th>
            <th>{t("farmer.colTest")}</th>
            <th>{t("farmer.colProcurement")}</th>
            <th>{t("farmer.colPayment")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const a = adminStatusOf(r.status, r.infoRequested, t);
            return (
              <tr key={r.id}>
                <td>
                  <Link href={`/farmer/harvests/${r.id}`} className="font-semibold text-leaf-700 hover:underline">
                    {r.title}
                  </Link>
                  <p className="text-xs text-muted">{r.code}</p>
                </td>
                <td>{t(`labels.millet.${r.milletType}`)}</td>
                <td>{formatKg(r.quantityGrams)}</td>
                <td>{formatDate(r.submittedAt)}</td>
                <td>
                  <Badge tone={a.tone}>{a.label}</Badge>
                </td>
                <td>
                  <StatusBadge map={TEST_STATUS} value={r.physicalTest?.status} />
                </td>
                <td>
                  <StatusBadge map={PROCUREMENT_STATUS} value={r.procurement?.status} />
                </td>
                <td>
                  <StatusBadge map={FARMER_PAYMENT_STATUS} value={r.procurement?.farmerPayment?.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
