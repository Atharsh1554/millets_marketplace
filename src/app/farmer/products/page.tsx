import Link from "next/link";
import { Store } from "lucide-react";
import { EmptyState, LinkButton, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { farmerProducts } from "@/server/services/farmer-portal";
import { getT } from "@/i18n/server";
import { formatDate, formatKg, formatWeight } from "@/lib/format";
import { PRODUCT_STATUS } from "@/lib/labels";

export default async function FarmerProductsPage() {
  const user = await requirePageRole(["FARMER"]);
  const [products, t] = await Promise.all([farmerProducts(user.farmer!.id), getT()]);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("farmer.productsTitle")} subtitle={t("farmer.productsSubtitle")} action={<LinkButton href="/farmer/submit">{t("farmerNav.addProduct")}</LinkButton>} />
      <div className="mb-4">
        <Notice tone="info">{t("farmer.productsNote")}</Notice>
      </div>
      {products.length === 0 ? (
        <EmptyState icon={Store} title={t("farmer.noProducts")} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("farmer.colProduct")}</th>
                <th>{t("farmer.colCategory")}</th>
                <th>{t("farmer.colMillet")}</th>
                <th>{t("farmer.colPack")}</th>
                <th>{t("farmer.colBatch")}</th>
                <th>{t("farmer.colBatchStock")}</th>
                <th>{t("farmer.colListed")}</th>
                <th>{t("farmer.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]?.url} alt="" className="size-10 rounded-lg object-cover" />
                      {["AVAILABLE_FOR_SALE", "SOLD_OUT"].includes(p.status) ? (
                        <Link href={`/shop/${p.slug}`} className="font-semibold text-leaf-700 hover:underline">{p.name}</Link>
                      ) : (
                        <span className="font-semibold">{p.name}</span>
                      )}
                    </div>
                  </td>
                  <td>{t(`labels.category.${p.category}`)}</td>
                  <td>{t(`labels.millet.${p.milletType}`)}</td>
                  <td>{formatWeight(p.weightGrams)}</td>
                  <td className="font-mono text-xs">{p.inventory.batch.batchNumber}</td>
                  <td>{formatKg(p.inventory.quantityAvailableGrams)}</td>
                  <td>{formatDate(p.publishedAt)}</td>
                  <td><StatusBadge map={PRODUCT_STATUS} value={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
