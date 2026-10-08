import type { DeliveryMethod, OrderStatus } from "@prisma/client";
import { msg } from "@/i18n/translate";
import { db } from "@/server/db";
import { AppError, ForbiddenError, NotFoundError } from "@/server/errors";
import { getPaymentProvider } from "@/server/payments";
import { addressSchema, checkoutSchema, reviewSchema } from "@/server/validation";
import { codes } from "./codes";
import { PUBLIC_PRODUCT_WHERE, recalcInventory } from "./inventory";
import { notifyRole, notifyUser } from "./notifications";
import { assertRole, type Actor } from "./types";
import { formatINR } from "@/lib/format";

export const MAX_QTY_PER_ITEM = 20;
export const FREE_DELIVERY_MIN_PAISE = 49900;
export const DELIVERY_FEES: Record<DeliveryMethod, number> = { STANDARD: 4000, EXPRESS: 9900 };

// ───────────── Cart ─────────────

async function purchasable(productId: string) {
  const p = await db.product.findFirst({ where: { AND: [{ id: productId }, PUBLIC_PRODUCT_WHERE, { status: "AVAILABLE_FOR_SALE" }] }, include: { inventory: true } });
  if (!p) throw new AppError(msg("errors.productUnavailable"));
  return p;
}

export async function getCart(userId: string) {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { orderBy: { id: "asc" }, include: { product: { include: { images: { take: 1 }, inventory: { select: { quantityAvailableGrams: true } } } } } } },
  });
  return cart?.items ?? [];
}

export async function cartCount(userId: string) {
  const agg = await db.cartItem.aggregate({ where: { cart: { userId } }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}

export async function addToCart(actor: Actor, productId: string, quantity: number) {
  assertRole(actor, ["CUSTOMER"]);
  if (!Number.isInteger(quantity) || quantity < 1) throw new AppError(msg("errors.invalidQuantity"));
  const p = await purchasable(productId);
  const cart = await db.cart.upsert({ where: { userId: actor.id }, create: { userId: actor.id }, update: {} });
  const existing = await db.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
  const next = Math.min((existing?.quantity ?? 0) + quantity, MAX_QTY_PER_ITEM);
  if (next * p.weightGrams > p.inventory.quantityAvailableGrams) throw new AppError(msg("errors.notEnoughStock"));
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: next },
    update: { quantity: next },
  });
}

export async function setCartQuantity(actor: Actor, productId: string, quantity: number) {
  assertRole(actor, ["CUSTOMER"]);
  const cart = await db.cart.findUnique({ where: { userId: actor.id } });
  if (!cart) return;
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return;
  }
  const p = await purchasable(productId);
  const q = Math.min(quantity, MAX_QTY_PER_ITEM);
  if (q * p.weightGrams > p.inventory.quantityAvailableGrams) throw new AppError(msg("errors.notEnoughStock"));
  await db.cartItem.update({ where: { cartId_productId: { cartId: cart.id, productId } }, data: { quantity: q } });
}

/** Pricing is ALWAYS computed on the server from current DB prices. */
export function priceCart(items: Array<{ quantity: number; product: { pricePaise: number; mrpPaise: number } }>, delivery: DeliveryMethod = "STANDARD") {
  const subtotal = items.reduce((s, i) => s + i.product.mrpPaise * i.quantity, 0);
  const discount = items.reduce((s, i) => s + (i.product.mrpPaise - i.product.pricePaise) * i.quantity, 0);
  const goods = subtotal - discount;
  const deliveryFee = items.length === 0 ? 0 : delivery === "STANDARD" && goods >= FREE_DELIVERY_MIN_PAISE ? 0 : DELIVERY_FEES[delivery];
  return { subtotal, discount, delivery: deliveryFee, total: goods + deliveryFee };
}

// ───────────── Addresses ─────────────

export async function addAddress(actor: Actor, raw: unknown) {
  const input = addressSchema.parse(raw);
  const count = await db.address.count({ where: { userId: actor.id } });
  if (count >= 10) throw new AppError(msg("errors.addressLimit"));
  return db.address.create({ data: { ...input, userId: actor.id, isDefault: count === 0 } });
}

// ───────────── Orders ─────────────

/**
 * Places an order from the cart. In one transaction: re-validates every product against the
 * marketplace gate, atomically decrements inventory (never below zero), snapshots prices, clears the cart.
 */
export async function placeOrder(actor: Actor, raw: unknown) {
  assertRole(actor, ["CUSTOMER"]);
  const input = checkoutSchema.parse(raw);
  const address = await db.address.findFirst({ where: { id: input.addressId, userId: actor.id } });
  if (!address) throw new AppError(msg("errors.invalidAddress"));
  const provider = getPaymentProvider();

  const order = await db.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({ where: { userId: actor.id }, include: { items: { include: { product: true } } } });
    if (!cart || cart.items.length === 0) throw new AppError(msg("errors.cartEmpty"));

    const ids = cart.items.map((i) => i.productId);
    const allowed = await tx.product.findMany({ where: { AND: [{ id: { in: ids } }, PUBLIC_PRODUCT_WHERE, { status: "AVAILABLE_FOR_SALE" }] }, select: { id: true } });
    const allowedSet = new Set(allowed.map((a) => a.id));
    const blocked = cart.items.filter((i) => !allowedSet.has(i.productId));
    if (blocked.length) throw new AppError(msg("errors.noLongerAvailable", { names: blocked.map((b) => b.product.name).join(", ") }));

    for (const item of cart.items) {
      const grams = item.product.weightGrams * item.quantity;
      const res = await tx.inventory.updateMany({
        where: { id: item.product.inventoryId, quantityAvailableGrams: { gte: grams } },
        data: { quantityAvailableGrams: { decrement: grams }, quantitySoldGrams: { increment: grams } },
      });
      if (res.count !== 1) throw new AppError(msg("errors.notEnoughStockFor", { name: item.product.name }));
    }

    const totals = priceCart(cart.items, input.deliveryMethod);
    const created = await tx.order.create({
      data: {
        code: await codes.order(tx),
        userId: actor.id,
        shipName: address.fullName,
        shipPhone: address.phone,
        shipLine1: address.line1,
        shipLine2: address.line2,
        shipCity: address.city,
        shipDistrict: address.district,
        shipState: address.state,
        shipPincode: address.pincode,
        deliveryMethod: input.deliveryMethod,
        paymentMethod: input.paymentMethod,
        subtotalPaise: totals.subtotal,
        discountPaise: totals.discount,
        deliveryPaise: totals.delivery,
        totalPaise: totals.total,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            inventoryId: i.product.inventoryId,
            productName: i.product.name,
            weightGrams: i.product.weightGrams,
            quantity: i.quantity,
            unitPricePaise: i.product.pricePaise,
            lineTotalPaise: i.product.pricePaise * i.quantity,
          })),
        },
        payment: { create: { method: input.paymentMethod, provider: provider.name, isMock: provider.isMock, amountPaise: totals.total, status: "PENDING" } },
      },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    for (const invId of new Set(cart.items.map((i) => i.product.inventoryId))) await recalcInventory(tx, invId);
    await notifyRole(tx, ["ADMIN"], "New customer order", `${created.code} · ${formatINR(totals.total)} (${input.paymentMethod})`, `/admin/orders/${created.id}`);
    return created;
  });

  // Charge outside the DB transaction (network call in production).
  if (input.paymentMethod !== "COD") {
    try {
      const result = await provider.charge({ method: input.paymentMethod, amountPaise: order.totalPaise, orderCode: order.code });
      if (result.status === "SUCCEEDED") {
        await recordPaymentSuccess(order.id, result.providerRef);
      } else {
        await cancelOrderInternal(order.id, msg("notif.reasons.paymentFailed"), "FAILED");
        throw new AppError(msg("errors.paymentFailed"));
      }
    } catch (err) {
      await cancelOrderInternal(order.id, msg("notif.reasons.paymentError"), "FAILED").catch(() => undefined);
      throw err instanceof AppError ? err : new AppError(msg("errors.paymentError"));
    }
  }
  await notifyUser(db, actor.id, msg("notif.orderPlaced.title"), msg("notif.orderPlaced.body", { code: order.code }), `/customer/orders/${order.id}`);
  return order;
}

/** Marks a payment succeeded and records the gateway fee as an expense (single source for profit). */
async function recordPaymentSuccess(orderId: string, providerRef: string | null) {
  const provider = getPaymentProvider();
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { orderId }, include: { order: true } });
    if (!payment || payment.status === "SUCCEEDED") return;
    const fee = provider.feeFor(payment.method, payment.amountPaise);
    await tx.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", providerRef, feePaise: fee } });
    if (fee > 0) {
      await tx.expense.create({
        data: { category: "PAYMENT_GATEWAY_FEES", amountPaise: fee, description: `Gateway fee · ${payment.order.code}`, date: new Date(), orderId, isDemo: payment.isMock },
      });
    }
  });
}

/** Restores inventory and cancels the order. */
async function cancelOrderInternal(orderId: string, reason: string, paymentStatus: "FAILED" | "REFUNDED" | null) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } });
    if (!order || order.status === "CANCELLED") return;
    for (const item of order.items) {
      const grams = item.weightGrams * item.quantity;
      await tx.inventory.update({ where: { id: item.inventoryId }, data: { quantityAvailableGrams: { increment: grams }, quantitySoldGrams: { decrement: grams } } });
    }
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    if (order.payment && paymentStatus) {
      const next = order.payment.status === "SUCCEEDED" ? "REFUNDED" : paymentStatus === "REFUNDED" ? "FAILED" : paymentStatus;
      await tx.payment.update({ where: { id: order.payment.id }, data: { status: next } });
    }
    for (const invId of new Set(order.items.map((i) => i.inventoryId))) await recalcInventory(tx, invId);
    await notifyUser(tx, order.userId, msg("notif.orderCancelled.title"), msg("notif.orderCancelled.body", { code: order.code, reason }), `/customer/orders/${order.id}`);
  });
}

export async function cancelOrder(actor: Actor, orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (actor.role === "CUSTOMER") {
    if (order.userId !== actor.id) throw new ForbiddenError();
    if (order.status !== "PLACED") throw new AppError(msg("errors.cancelBeforeConfirm"));
  } else {
    assertRole(actor, ["ADMIN"]);
    if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(order.status)) throw new AppError("This order can no longer be cancelled.");
  }
  await cancelOrderInternal(orderId, actor.role === "CUSTOMER" ? msg("notif.reasons.byYou") : msg("notif.reasons.byTeam"), "REFUNDED");
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

/** Our organization processes the order (farmers never fulfil customer orders). */
export async function advanceOrder(actor: Actor, orderId: string) {
  assertRole(actor, ["ADMIN"]);
  const order = await db.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw new NotFoundError("Order");
  const next = NEXT_STATUS[order.status];
  if (!next) throw new AppError("This order cannot be advanced further.");
  if (order.paymentMethod !== "COD" && order.payment?.status !== "SUCCEEDED") throw new AppError("Payment has not been received for this order.");

  const stamp: Record<string, Date> = {};
  stamp[{ CONFIRMED: "confirmedAt", PACKED: "packedAt", SHIPPED: "shippedAt", OUT_FOR_DELIVERY: "outForDeliveryAt", DELIVERED: "deliveredAt" }[next as string]!] = new Date();

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: next, ...stamp } });
    await notifyUser(tx, order.userId, msg(`notif.order.${next}.title`), msg(`notif.order.${next}.body`, { code: order.code }), `/customer/orders/${order.id}`);
  });
  // Cash on delivery is collected on delivery.
  if (next === "DELIVERED" && order.paymentMethod === "COD") await recordPaymentSuccess(order.id, `COD-${order.code}`);
}

export async function customerOrders(userId: string) {
  return db.order.findMany({ where: { userId }, orderBy: { placedAt: "desc" }, include: { items: true, payment: true } });
}

export async function orderDetail(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      payment: true,
      items: { include: { product: { select: { slug: true, images: { take: 1 } } }, inventory: { select: { batch: { select: { batchNumber: true } } } } } },
    },
  });
}

// ───────────── Reviews & wishlist ─────────────

/** Only customers with a delivered order containing the product can review it. */
export async function upsertReview(actor: Actor, raw: unknown) {
  assertRole(actor, ["CUSTOMER"]);
  const input = reviewSchema.parse(raw);
  const bought = await db.orderItem.findFirst({ where: { productId: input.productId, order: { userId: actor.id, status: "DELIVERED" } } });
  if (!bought) throw new AppError(msg("errors.reviewAfterDelivery"));
  await db.review.upsert({
    where: { productId_userId: { productId: input.productId, userId: actor.id } },
    create: { productId: input.productId, userId: actor.id, rating: input.rating, comment: input.comment },
    update: { rating: input.rating, comment: input.comment },
  });
}

export async function toggleWishlist(actor: Actor, productId: string) {
  assertRole(actor, ["CUSTOMER"]);
  const product = await db.product.findFirst({ where: { AND: [{ id: productId }, PUBLIC_PRODUCT_WHERE] }, select: { id: true } });
  if (!product) throw new NotFoundError("Product");
  const wl = await db.wishlist.upsert({ where: { userId: actor.id }, create: { userId: actor.id }, update: {} });
  const existing = await db.wishlistItem.findUnique({ where: { wishlistId_productId: { wishlistId: wl.id, productId } } });
  if (existing) await db.wishlistItem.delete({ where: { id: existing.id } });
  else await db.wishlistItem.create({ data: { wishlistId: wl.id, productId } });
  return !existing;
}

export async function wishlistProductIds(userId: string) {
  const items = await db.wishlistItem.findMany({ where: { wishlist: { userId } }, select: { productId: true } });
  return new Set(items.map((i) => i.productId));
}
