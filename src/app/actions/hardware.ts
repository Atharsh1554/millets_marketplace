"use server";

import type { FormResult } from "@/components/forms";
import { msg } from "@/i18n/translate";
import { requireActor } from "@/server/auth/guard";
import { withAudit } from "@/server/run-action";
import { createEnquiry, createHardware, deleteHardwareImage, setHardwareStatus, updateEnquiry, updateHardware } from "@/server/services/hardware";
import { filesFrom } from "@/server/storage";
import { formToObject } from "@/server/validation";

const admin = () => requireActor(["ADMIN"]);

// ───────── Admin: hardware catalogue ─────────
export async function saveHardwareAction(_: FormResult, form: FormData) {
  return withAudit("saveHardwareAction", form, async () => {
    const actor = await admin();
    const data = formToObject(form);
    const images = filesFrom(form, "images");
    if (data.productId) {
      await updateHardware(actor, data.productId, data, images);
      return { message: "Hardware product saved." };
    }
    const created = await createHardware(actor, data, images);
    return { redirectTo: `/admin/hardware/${created.id}?created=1`, message: "Hardware product created as a draft." };
  });
}

export async function hardwareStatusAction(_: FormResult, form: FormData) {
  const status = String(form.get("status"));
  const message = status === "PUBLISHED" ? "Published — farmers can now see this product." : status === "ARCHIVED" ? "Product archived." : "Product unpublished (draft).";
  return withAudit("hardwareStatusAction", form, async () => setHardwareStatus(await admin(), formToObject(form)), message);
}

export async function deleteHardwareImageAction(_: FormResult, form: FormData) {
  return withAudit("deleteHardwareImageAction", form, async () => deleteHardwareImage(await admin(), String(form.get("id"))), "Image removed.");
}

export async function updateHardwareEnquiryAction(_: FormResult, form: FormData) {
  return withAudit("updateHardwareEnquiryAction", form, async () => updateEnquiry(await admin(), formToObject(form)), "Enquiry updated. Farmer notified.");
}

// ───────── Farmer: enquiries ─────────
export async function submitHardwareEnquiryAction(_: FormResult, form: FormData) {
  return withAudit("submitHardwareEnquiryAction", form, async () => {
    await createEnquiry(await requireActor(["FARMER"]), formToObject(form));
  }, msg("success.enquirySubmitted"));
}
