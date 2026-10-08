"use client";

import { saveHardwareAction } from "@/app/actions/hardware";
import { ActionForm, SelectField, SubmitButton, TextArea, TextField } from "@/components/forms";
import { HARDWARE_CATEGORIES } from "@/lib/labels";

const CATEGORY_LABEL: Record<string, string> = {
  PROCESSING: "Millet Processing",
  DEHULLING: "Dehulling",
  CLEANING: "Grain Cleaning",
  DRYING: "Drying",
  STORAGE: "Storage",
  WEIGHING: "Weighing",
  OTHER: "Other Hardware",
};

export type HardwareFormValues = {
  productId?: string;
  name: string;
  category: string;
  description: string;
  mainBenefit: string;
  overview: string;
  features: string;
  benefits: string;
  specifications: string;
  suitableFor: string;
  howItWorks: string;
  featured: boolean;
};

const EMPTY: HardwareFormValues = {
  name: "",
  category: "PROCESSING",
  description: "",
  mainBenefit: "",
  overview: "",
  features: "",
  benefits: "",
  specifications: "",
  suitableFor: "",
  howItWorks: "",
  featured: false,
};

/** Admin create/edit form for hardware products. List fields are one item per line. */
export function HardwareForm({ initial, imageCount = 0 }: { initial?: HardwareFormValues; imageCount?: number }) {
  const v = initial ?? EMPTY;
  return (
    <ActionForm action={saveHardwareAction} className="space-y-5">
      {v.productId && <input type="hidden" name="productId" value={v.productId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Product name" name="name" required defaultValue={v.name} placeholder="e.g. Millet Dehulling Machine" />
        <SelectField label="Category" name="category" defaultValue={v.category} options={HARDWARE_CATEGORIES.map((c) => [c, CATEGORY_LABEL[c]])} />
        <TextField label="Short description (card)" name="description" required defaultValue={v.description} className="sm:col-span-2" maxLength={300} />
        <TextField label="Main benefit" name="mainBenefit" required defaultValue={v.mainBenefit} className="sm:col-span-2" maxLength={200} placeholder="e.g. Removes husk from 100 kg of millet per hour" />
      </div>
      <TextArea label="Product overview" name="overview" required defaultValue={v.overview} rows={5} hint="A few sentences about what the hardware is. Separate paragraphs with a blank line." />
      <TextArea
        label="How It Works"
        name="howItWorks"
        required
        defaultValue={v.howItWorks}
        rows={7}
        hint="One step per line, in simple farmer-friendly language. Shown as numbered steps."
        placeholder={"The millet grains are poured into the hopper at the top.\nThe dehulling rollers gently rub off the outer husk.\nA fan blows the light husk out through the side outlet.\nClean grains are collected from the output chute."}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextArea label="Features" name="features" required defaultValue={v.features} rows={5} hint="One feature per line." />
        <TextArea label="Benefits" name="benefits" required defaultValue={v.benefits} rows={5} hint="One benefit per line." />
        <TextArea label="Specifications" name="specifications" required defaultValue={v.specifications} rows={5} hint='One per line as "Label: Value", e.g. "Capacity: 100 kg/hour".' />
        <TextArea label="Suitable users / use cases" name="suitableFor" required defaultValue={v.suitableFor} rows={5} hint="One per line." />
      </div>
      <div>
        <label className="label" htmlFor="images">
          Product images
        </label>
        <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="input py-2" />
        <p className="mt-1 text-xs text-muted">JPG, PNG or WebP, up to 8 MB each, max 8 images per product{imageCount ? ` (${imageCount} uploaded)` : ""}. Stored through the configured storage provider.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={v.featured} className="size-4 accent-leaf-700" /> Feature first on the farmer dashboard
      </label>
      <SubmitButton size="lg">{v.productId ? "Save changes" : "Create product (draft)"}</SubmitButton>
    </ActionForm>
  );
}
