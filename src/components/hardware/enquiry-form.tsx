"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { submitHardwareEnquiryAction } from "@/app/actions/hardware";
import { ActionForm, SubmitButton, TextArea, TextField } from "@/components/forms";
import { useT } from "@/i18n/client";

/** Farmer enquiry form — large, simple controls for phones. */
export function EnquiryForm({ productId, defaultName, defaultPhone }: { productId: string; defaultName: string; defaultPhone: string }) {
  const t = useT();
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl bg-leaf-50 p-6 text-center ring-1 ring-leaf-200">
        <CheckCircle2 className="size-10 text-leaf-600" />
        <p className="text-lg font-semibold text-leaf-800">{t("success.enquirySubmitted")}</p>
        <button type="button" onClick={() => setSent(false)} className="text-sm font-semibold text-leaf-700 underline">
          {t("hardware.sendAnother")}
        </button>
      </div>
    );
  return (
    <ActionForm action={submitHardwareEnquiryAction} onSuccess={() => setSent(true)} showSuccess={false} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="productId" value={productId} />
      <TextField label={t("hardware.quantity")} name="quantity" type="number" inputMode="numeric" min={1} max={10000} defaultValue={1} required className="text-base" />
      <TextField label={t("hardware.requirement")} name="requirement" placeholder={t("hardware.requirementPlaceholder")} />
      <TextField label={t("hardware.yourName")} name="contactName" required defaultValue={defaultName} autoComplete="name" />
      <TextField label={t("fields.phone")} name="contactPhone" type="tel" inputMode="tel" required defaultValue={defaultPhone} autoComplete="tel" />
      <TextArea label={t("fields.message")} name="message" required rows={4} className="sm:col-span-2" placeholder={t("hardware.messagePlaceholder")} />
      <div className="sm:col-span-2">
        <SubmitButton size="lg" className="w-full sm:w-auto">
          <Send className="size-5" /> {t("hardware.send")}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
