"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { reviewAction } from "@/app/actions/shop";
import { ActionForm, SubmitButton, TextArea } from "@/components/forms";
import { useT } from "@/i18n/client";

export function ReviewForm({ productId, initial }: { productId: string; initial?: { rating: number; comment: string } }) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const t = useT();
  return (
    <ActionForm action={reviewAction} className="card space-y-3 p-4">
      <h3 className="font-semibold text-earth-900">{initial ? t("product.updateReview") : t("product.writeReview")}</h3>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" role="radiogroup" aria-label={t("shop.rating")}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} aria-label={t("product.stars", { n: i })} aria-checked={rating === i} role="radio">
            <Star className={`size-7 ${i <= rating ? "fill-millet-400 text-millet-400" : "text-earth-200"}`} />
          </button>
        ))}
      </div>
      <TextArea label={t("product.yourReview")} name="comment" required defaultValue={initial?.comment} maxLength={1000} placeholder={t("product.reviewPlaceholder")} />
      <SubmitButton>{t("product.submitReview")}</SubmitButton>
    </ActionForm>
  );
}
