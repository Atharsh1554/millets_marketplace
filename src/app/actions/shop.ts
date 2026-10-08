"use server";

import type { FormResult } from "@/components/forms";
import { msg } from "@/i18n/translate";
import { requireActor } from "@/server/auth/guard";
import { runAction, withAudit } from "@/server/run-action";
import { addAddress, addToCart, cancelOrder, placeOrder, setCartQuantity, toggleWishlist, upsertReview } from "@/server/services/shop";
import { markAllRead } from "@/server/services/notifications";
import { formToObject } from "@/server/validation";
import { AppError } from "@/server/errors";

const customer = async () => {
  try {
    return await requireActor(["CUSTOMER"]);
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHORIZED") throw new AppError(msg("errors.signInAsCustomer"), "UNAUTHORIZED");
    if (e instanceof AppError && e.code === "FORBIDDEN") throw new AppError(msg("errors.customerOnly"));
    throw e;
  }
};

export async function addToCartAction(_: FormResult, form: FormData) {
  return runAction(async () => {
    const actor = await customer();
    await addToCart(actor, String(form.get("productId")), Number(form.get("quantity") ?? 1));
    if (form.get("buyNow")) return { redirectTo: "/customer/checkout" };
  }, msg("success.addedToCart"));
}

export async function setCartQuantityAction(_: FormResult, form: FormData) {
  return runAction(async () => setCartQuantity(await customer(), String(form.get("productId")), Number(form.get("quantity"))));
}

export async function toggleWishlistAction(_: FormResult, form: FormData) {
  return runAction(async () => {
    const added = await toggleWishlist(await customer(), String(form.get("productId")));
    return { message: added ? msg("success.savedToWishlist") : msg("success.removedFromWishlist") };
  });
}

export async function addAddressAction(_: FormResult, form: FormData) {
  return withAudit("addAddressAction", form, async () => {
    const a = await addAddress(await customer(), formToObject(form));
    return { data: { id: a.id }, message: msg("success.addressSaved") };
  });
}

export async function placeOrderAction(_: FormResult, form: FormData) {
  return withAudit("placeOrderAction", form, async () => {
    const order = await placeOrder(await customer(), formToObject(form));
    return { redirectTo: `/customer/orders/${order.id}?placed=1` };
  });
}

export async function cancelMyOrderAction(_: FormResult, form: FormData) {
  return withAudit("cancelMyOrderAction", form, async () => cancelOrder(await customer(), String(form.get("orderId"))), msg("success.orderCancelled"));
}

export async function reviewAction(_: FormResult, form: FormData) {
  return withAudit("reviewAction", form, async () => upsertReview(await customer(), formToObject(form)), msg("success.reviewThanks"));
}

export async function markNotificationsReadAction() {
  const actor = await requireActor();
  await markAllRead(actor.id);
  return runAction(async () => undefined);
}
