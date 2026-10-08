"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Info, Loader2, Send, Save, Video, X } from "lucide-react";
import { submitHarvestAction } from "@/app/actions/harvest";
import { FormCtx, FormMessage, SelectField, TextArea, TextField, type FormResult } from "@/components/forms";
import { buttonClass } from "@/components/ui";
import { MILLET_TYPES } from "@/lib/labels";
import { useT } from "@/i18n/client";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 40 * 1024 * 1024;

const PHOTO_SLOTS = ["HARVEST", "GRAIN", "FARM", "PACKAGE"] as const;

export type HarvestDefaults = Partial<{
  submissionId: string;
  title: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  village: string;
  district: string;
  state: string;
  farmLocation: string;
  milletType: string;
  harvestDate: string;
  quantityKg: string;
  expectedPricePerKg: string;
  cultivationMethod: string;
  processingMethod: string;
  storageMethod: string;
  description: string;
  notes: string;
}>;

type Picked = { id: string; file: File; url: string };

export function HarvestForm({ defaults, existingMedia = 0 }: { defaults: HarvestDefaults; existingMedia?: number }) {
  const [state, dispatch, pending] = useActionState<FormResult, FormData>(submitHarvestAction, null);
  const [files, setFiles] = useState<Record<string, Picked[]>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (state?.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  const add = (kind: string, list: FileList | null) => {
    if (!list) return;
    setLocalError(null);
    const next: Picked[] = [];
    for (const f of Array.from(list)) {
      const isVideo = kind === "VIDEO";
      if (isVideo ? !f.type.startsWith("video/") : !["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        setLocalError(t(isVideo ? "harvestForm.wrongVideo" : "harvestForm.wrongPhoto", { name: f.name }));
        continue;
      }
      if (f.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) {
        setLocalError(t("errors.fileTooLarge", { name: f.name, mb: isVideo ? 40 : 8 }));
        continue;
      }
      next.push({ id: `${f.name}-${f.size}-${Math.random()}`, file: f, url: URL.createObjectURL(f) });
    }
    setFiles((prev) => ({ ...prev, [kind]: kind === "VIDEO" ? next.slice(0, 1) : [...(prev[kind] ?? []), ...next].slice(0, 6) }));
  };

  const remove = (kind: string, id: string) => setFiles((prev) => ({ ...prev, [kind]: (prev[kind] ?? []).filter((p) => p.id !== id) }));

  const submit = (intent: "draft" | "submit") => {
    if (!formRef.current) return;
    if (intent === "submit" && !formRef.current.reportValidity()) return;
    const photoCount = existingMedia + PHOTO_SLOTS.reduce((s, slot) => s + (files[slot]?.length ?? 0), 0);
    if (intent === "submit" && photoCount === 0) {
      setLocalError(t("errors.photoRequired"));
      return;
    }
    const fd = new FormData(formRef.current);
    fd.set("intent", intent);
    for (const [kind, list] of Object.entries(files)) for (const p of list) fd.append(`media_${kind}`, p.file);
    startTransition(() => dispatch(fd));
  };

  const d = defaults;
  return (
    <FormCtx.Provider value={{ state, pending }}>
      <form ref={formRef} onSubmit={(e) => (e.preventDefault(), submit("submit"))} className="space-y-6" noValidate={false}>
        {d.submissionId && <input type="hidden" name="submissionId" value={d.submissionId} />}

        <Section n={1} title={t("harvestForm.farmerSection")} subtitle={t("harvestForm.farmerSectionHint")}>
          <TextField label={t("fields.farmerName")} name="contactName" required defaultValue={d.contactName} autoComplete="name" />
          <TextField label={t("fields.phone")} name="contactPhone" type="tel" required defaultValue={d.contactPhone} autoComplete="tel" inputMode="tel" />
          <TextField label={t("fields.email")} name="contactEmail" type="email" defaultValue={d.contactEmail} autoComplete="email" className="sm:col-span-2" />
          <TextField label={t("fields.village")} name="village" required defaultValue={d.village} />
          <TextField label={t("fields.district")} name="district" required defaultValue={d.district} />
          <TextField label={t("fields.state")} name="state" required defaultValue={d.state} />
          <TextField label={t("account.farmLocation")} name="farmLocation" defaultValue={d.farmLocation} placeholder={t("account.farmLocationPlaceholder")} />
        </Section>

        <Section n={2} title={t("harvestForm.harvestSection")} subtitle={t("harvestForm.harvestSectionHint")}>
          <TextField label={t("fields.harvestName")} name="title" required defaultValue={d.title} placeholder={t("harvestForm.harvestNamePlaceholder")} className="sm:col-span-2" />
          <SelectField label={t("harvestForm.milletType")} name="milletType" required defaultValue={d.milletType ?? ""} placeholder={t("harvestForm.chooseMillet")} options={MILLET_TYPES.map((m) => [m, t(`labels.millet.${m}`)])} />
          <TextField label={t("fields.harvestDate")} name="harvestDate" type="date" required defaultValue={d.harvestDate} max={new Date().toISOString().slice(0, 10)} />
          <TextField label={t("harvestForm.quantityKg")} name="quantityKg" type="number" inputMode="decimal" min={1} step="0.1" required defaultValue={d.quantityKg} />
          <TextField label={t("harvestForm.priceKg")} name="expectedPricePerKg" type="number" inputMode="decimal" min={1} step="0.5" required defaultValue={d.expectedPricePerKg} />
          <TextField label={t("fields.cultivationMethod")} name="cultivationMethod" required defaultValue={d.cultivationMethod} placeholder={t("harvestForm.cultivationPlaceholder")} list="cultivation-options" />
          <TextField label={t("fields.processingMethod")} name="processingMethod" required defaultValue={d.processingMethod} placeholder={t("harvestForm.processingPlaceholder")} list="processing-options" />
          <TextField label={t("fields.storageMethod")} name="storageMethod" required defaultValue={d.storageMethod} placeholder={t("harvestForm.storagePlaceholder")} list="storage-options" className="sm:col-span-2" />
          <TextArea label={t("fields.harvestDescription")} name="description" required minLength={10} defaultValue={d.description} className="sm:col-span-2" placeholder={t("harvestForm.descriptionPlaceholder")} />
          <TextArea label={t("harvestForm.notes")} name="notes" defaultValue={d.notes} className="sm:col-span-2" rows={2} placeholder={t("harvestForm.notesPlaceholder")} />
          <datalist id="cultivation-options">
            <option value={t("harvestForm.optRainfed")} />
            <option value={t("harvestForm.optIrrigated")} />
            <option value={t("harvestForm.optNatural")} />
          </datalist>
          <datalist id="processing-options">
            <option value={t("harvestForm.optSunDried")} />
            <option value={t("harvestForm.optMachine")} />
            <option value={t("harvestForm.optDehusked")} />
          </datalist>
          <datalist id="storage-options">
            <option value={t("harvestForm.optJute")} />
            <option value={t("harvestForm.optHermetic")} />
            <option value={t("harvestForm.optBin")} />
          </datalist>
        </Section>

        <Section n={3} title={t("harvestForm.photosSection")} subtitle={t("harvestForm.photosSectionHint")}>
          {PHOTO_SLOTS.map((slot) => (
            <PhotoSlot key={slot} kind={slot} label={t(`harvestForm.slot.${slot}`)} hint={t(`harvestForm.slotHint.${slot}`)} picked={files[slot] ?? []} onAdd={add} onRemove={remove} />
          ))}
          <div className="sm:col-span-2">
            <p className="label">{t("harvestForm.video")}</p>
            {(files.VIDEO ?? []).length > 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-cream p-3 text-sm">
                <Video className="size-5 text-leaf-700" />
                <span className="flex-1 truncate">{files.VIDEO[0].file.name}</span>
                <button type="button" onClick={() => remove("VIDEO", files.VIDEO[0].id)} className="text-red-700" aria-label={t("harvestForm.removeVideo")}>
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-earth-200 bg-white px-4 py-4 text-sm font-semibold text-earth-700 hover:border-leaf-400">
                <Video className="size-5" /> {t("harvestForm.addVideo")}
                <input type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(e) => (add("VIDEO", e.target.files), (e.target.value = ""))} />
              </label>
            )}
          </div>
          {existingMedia > 0 && <p className="text-xs text-muted sm:col-span-2">{t("harvestForm.existing", { count: existingMedia })}</p>}
        </Section>

        {localError && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </p>
        )}
        <FormMessage />

        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-earth-100 bg-cream/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
          <button type="button" onClick={() => submit("draft")} disabled={pending} className={buttonClass("outline", "lg")}>
            <Save className="size-5" /> {t("harvestForm.saveDraft")}
          </button>
          <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />} {t("harvestForm.submit")}
          </button>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Info className="mt-0.5 size-4 shrink-0" /> {t("harvestForm.afterSubmit")}
        </p>
      </form>
    </FormCtx.Provider>
  );
}

function Section({ n, title, subtitle, children }: { n: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-leaf-700 text-sm font-bold text-white">{n}</span>
        <div>
          <h2 className="font-semibold text-earth-900">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function PhotoSlot({
  kind,
  label,
  hint,
  picked,
  onAdd,
  onRemove,
}: {
  kind: string;
  label: string;
  hint: string;
  picked: Picked[];
  onAdd: (kind: string, l: FileList | null) => void;
  onRemove: (kind: string, id: string) => void;
}) {
  const t = useT();
  return (
    <div>
      <p className="label">{label}</p>
      <p className="-mt-1 mb-2 text-xs text-muted">{hint}</p>
      <div className="grid grid-cols-3 gap-2">
        {picked.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-cream">
            <img src={p.url} alt="" className="size-full object-cover" />
            <button type="button" onClick={() => onRemove(kind, p.id)} className="absolute top-1 right-1 rounded-full bg-earth-900/70 p-1 text-white" aria-label={t("harvestForm.removePhoto")}>
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {picked.length < 6 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-earth-200 bg-white text-xs font-semibold text-earth-600 hover:border-leaf-400 hover:text-leaf-700">
            {picked.length === 0 ? <Camera className="size-6" /> : <ImagePlus className="size-6" />}
            {t("harvestForm.add")}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => (onAdd(kind, e.target.files), (e.target.value = ""))} />
          </label>
        )}
      </div>
    </div>
  );
}
