import Link from "next/link";
import { Wallet } from "lucide-react";
import { Badge, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { formatDateTime, formatINR } from "@/lib/format";
import { PAYMENT_STATUS } from "@/lib/labels";
import { getT } from "@/i18n/server";

export default async function CustomerPaymentsPage() {
  const user = await requirePageRole(["CUSTOMER"]);
  const t = await getT();
  const payments = await db.payment.findMany({ where: { order: { userId: user.id } }, orderBy: { createdAt: "desc" }, include: { order: { select: { id: true, code: true } } } });
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t("customerNav.payments")} subtitle={t("customer.paymentsSubtitle")} />
      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title={t("farmer.noPayments")} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("farmer.colDate")}</th>
                <th>{t("farmer.colOrder")}</th>
                <th>{t("customer.method")}</th>
                <th>{t("customer.amount")}</th>
                <th>{t("farmer.colStatus")}</th>
                <th>{t("farmer.colReference")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="text-xs">{formatDateTime(p.createdAt)}</td>
                  <td>
                    <Link href={`/customer/orders/${p.order.id}`} className="font-semibold text-leaf-700 hover:underline">{p.order.code}</Link>
                  </td>
                  <td>
                    {t(`labels.paymentMethod.${p.method}`)} {p.isMock && p.method !== "COD" && <Badge tone="gold">{t("common.demo.badge")}</Badge>}
                  </td>
                  <td className="font-semibold">{formatINR(p.amountPaise)}</td>
                  <td><StatusBadge map={PAYMENT_STATUS} value={p.status} /></td>
                  <td className="font-mono text-xs">{p.providerRef ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
