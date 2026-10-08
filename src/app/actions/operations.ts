"use server";

import type { FormResult } from "@/components/forms";
import { requireActor } from "@/server/auth/guard";
import { withAudit } from "@/server/run-action";
import { confirmReceipt, markCollected, moveToInventory, scheduleProcurement, updateFarmerPayment, updateTerms } from "@/server/services/procurement";
import { archiveProduct, createProduct, publishProduct, updateInventory, updateProduct } from "@/server/services/inventory";
import { advanceOrder, cancelOrder } from "@/server/services/shop";
import { addExpense, generateProfitRecord } from "@/server/services/finance";
import { createStaffUser } from "@/server/services/accounts";
import { formToObject } from "@/server/validation";

const admin = () => requireActor(["ADMIN"]);
const file = (form: FormData, name: string) => {
  const f = form.get(name);
  return f && typeof f === "object" && (f as File).size > 0 ? (f as File) : null;
};

// ───────── Procurement ─────────
export async function procurementTermsAction(_: FormResult, form: FormData) {
  return withAudit("procurementTermsAction", form, async () => updateTerms(await admin(), formToObject(form)), "Procurement terms updated.");
}
export async function scheduleProcurementAction(_: FormResult, form: FormData) {
  return withAudit("scheduleProcurementAction", form, async () => scheduleProcurement(await admin(), formToObject(form)), "Collection scheduled. Farmer notified.");
}
export async function procurementCollectedAction(_: FormResult, form: FormData) {
  return withAudit("procurementCollectedAction", form, async () => markCollected(await admin(), formToObject(form)), "Marked as collected.");
}
export async function confirmReceiptAction(_: FormResult, form: FormData) {
  return withAudit("confirmReceiptAction", form, async () => confirmReceipt(await admin(), formToObject(form)), "Receipt confirmed. Farmer payment created.");
}
export async function moveToInventoryAction(_: FormResult, form: FormData) {
  return withAudit("moveToInventoryAction", form, async () => {
    const inv = await moveToInventory(await admin(), formToObject(form));
    return { redirectTo: `/admin/inventory/${inv.id}`, message: "Moved to inventory." };
  });
}

// ───────── Farmer payments ─────────
export async function farmerPaymentAction(_: FormResult, form: FormData) {
  return withAudit("farmerPaymentAction", form, async () => updateFarmerPayment(await admin(), formToObject(form)), "Payment updated. Farmer notified.");
}

// ───────── Inventory & products ─────────
export async function createProductAction(_: FormResult, form: FormData) {
  return withAudit("createProductAction", form, async () => {
    await createProduct(await admin(), formToObject(form), file(form, "image"));
    return { message: "Listing created as Marketplace Approved. Publish it to make it visible to customers." };
  });
}
export async function updateProductAction(_: FormResult, form: FormData) {
  return withAudit("updateProductAction", form, async () => updateProduct(await admin(), formToObject(form), file(form, "image")), "Product updated.");
}
export async function publishProductAction(_: FormResult, form: FormData) {
  return withAudit("publishProductAction", form, async () => publishProduct(await admin(), String(form.get("productId"))), "Published to the marketplace.");
}
export async function archiveProductAction(_: FormResult, form: FormData) {
  return withAudit("archiveProductAction", form, async () => archiveProduct(await admin(), String(form.get("productId"))), "Product archived.");
}
export async function updateInventoryAction(_: FormResult, form: FormData) {
  return withAudit("updateInventoryAction", form, async () => updateInventory(await admin(), formToObject(form)), "Inventory updated.");
}

// ───────── Orders ─────────
export async function advanceOrderAction(_: FormResult, form: FormData) {
  return withAudit("advanceOrderAction", form, async () => advanceOrder(await admin(), String(form.get("orderId"))), "Order updated. Customer notified.");
}
export async function adminCancelOrderAction(_: FormResult, form: FormData) {
  return withAudit("adminCancelOrderAction", form, async () => cancelOrder(await admin(), String(form.get("orderId"))), "Order cancelled and stock restored.");
}

// ───────── Finance ─────────
export async function addExpenseAction(_: FormResult, form: FormData) {
  return withAudit("addExpenseAction", form, async () => addExpense(await admin(), formToObject(form)), "Expense recorded.");
}
export async function profitRecordAction(_: FormResult, form: FormData) {
  return withAudit("profitRecordAction", form, async () => generateProfitRecord(await admin(), String(form.get("period"))), "Profit snapshot saved.");
}

// ───────── Users ─────────
export async function createStaffAction(_: FormResult, form: FormData) {
  return withAudit("createStaffAction", form, async () => createStaffUser(await admin(), formToObject(form)), "Staff account created.");
}
