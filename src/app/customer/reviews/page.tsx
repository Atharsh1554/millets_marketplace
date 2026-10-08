import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { Stars } from "@/components/shop/product-card";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { formatDate } from "@/lib/format";
import { getT } from "@/i18n/server";

export default async function CustomerReviewsPage() {
  const user = await requirePageRole(["CUSTOMER"]);
  const t = await getT();
  const [reviews, delivered] = await Promise.all([
    db.review.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, slug: true, images: { take: 1 } } } } }),
    db.orderItem.findMany({
      where: { order: { userId: user.id, status: "DELIVERED" } },
      distinct: ["productId"],
      select: { productId: true, productName: true, product: { select: { slug: true, images: { take: 1 } } } },
    }),
  ]);
  const reviewed = new Set(reviews.map((r) => r.productId));
  const pending = delivered.filter((d) => !reviewed.has(d.productId));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t("customerNav.reviews")} subtitle={t("customer.reviewsSubtitle")} />
      {pending.length > 0 && (
        <Card>
          <CardHeader title={t("customer.waitingReview")} icon={Star} />
          <ul className="divide-y divide-earth-100">
            {pending.map((p) => (
              <li key={p.productId} className="flex items-center gap-3 px-5 py-3">
                <img src={p.product.images[0]?.url} alt="" className="size-12 rounded-xl object-cover" />
                <span className="flex-1 font-semibold text-earth-900">{p.productName}</span>
                <Link href={`/customer/shop/${p.product.slug}#reviews`} className="rounded-lg bg-leaf-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-leaf-800">
                  {t("product.writeReview")}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <CardHeader title={t("customer.myReviews")} />
        {reviews.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Star} title={t("shop.noReviews")} />
          </div>
        ) : (
          <ul className="divide-y divide-earth-100">
            {reviews.map((r) => (
              <li key={r.id} className="flex gap-3 px-5 py-4">
                <img src={r.product.images[0]?.url} alt="" className="size-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/customer/shop/${r.product.slug}#reviews`} className="font-semibold text-earth-900 hover:text-leaf-700">{r.product.name}</Link>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Stars value={r.rating} /> {formatDate(r.createdAt)}
                  </div>
                  <p className="mt-1 text-sm text-earth-800">{r.comment}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
