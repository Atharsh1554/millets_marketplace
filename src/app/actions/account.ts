"use server";

import type { FormResult } from "@/components/forms";
import { msg } from "@/i18n/translate";
import { requireActor } from "@/server/auth/guard";
import { withAudit } from "@/server/run-action";
import {
  changePassword,
  createComplaint,
  deleteAddress,
  setDefaultAddress,
  setFarmerVerification,
  updateComplaint,
  updateFarmProfile,
  updateProfile,
} from "@/server/services/account";
import { formToObject } from "@/server/validation";

export async function updateProfileAction(_: FormResult, form: FormData) {
  return withAudit("updateProfileAction", form, async () => updateProfile(await requireActor(), formToObject(form)), msg("success.profileUpdated"));
}

export async function changePasswordAction(_: FormResult, form: FormData) {
  // Audited without the form so no password material is ever recorded.
  return withAudit("changePasswordAction", undefined, async () => changePassword(await requireActor(), formToObject(form)), msg("success.passwordChanged"));
}

export async function updateFarmProfileAction(_: FormResult, form: FormData) {
  return withAudit("updateFarmProfileAction", form, async () => updateFarmProfile(await requireActor(["FARMER"]), formToObject(form)), msg("success.farmProfileUpdated"));
}

export async function deleteAddressAction(_: FormResult, form: FormData) {
  return withAudit("deleteAddressAction", form, async () => deleteAddress(await requireActor(["CUSTOMER"]), String(form.get("id"))), msg("success.addressRemoved"));
}

export async function setDefaultAddressAction(_: FormResult, form: FormData) {
  return withAudit("setDefaultAddressAction", form, async () => setDefaultAddress(await requireActor(["CUSTOMER"]), String(form.get("id"))), msg("success.defaultAddress"));
}

export async function createComplaintAction(_: FormResult, form: FormData) {
  return withAudit("createComplaintAction", form, async () => createComplaint(await requireActor(["CUSTOMER"]), formToObject(form)), msg("success.complaintSubmitted"));
}

export async function updateComplaintAction(_: FormResult, form: FormData) {
  return withAudit("updateComplaintAction", form, async () => updateComplaint(await requireActor(["ADMIN"]), formToObject(form)), "Complaint updated. Customer notified.");
}

export async function farmerVerificationAction(_: FormResult, form: FormData) {
  return withAudit("farmerVerificationAction", form, async () => setFarmerVerification(await requireActor(["ADMIN"]), formToObject(form)), "Verification updated. Farmer notified.");
}
