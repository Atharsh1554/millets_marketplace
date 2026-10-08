import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { getCart, priceCart } from "@/server/services/shop";
import { getPaymentProvider } from "@/server/payments";
import { CheckoutFlow } from "./checkout-flow";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requirePageRole(["CUSTOMER"], "/customer/checkout");
  const [items, addresses] = await Promise.all([getCart(user.id), db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] })]);
  if (items.length === 0) redirect("/customer/cart");
  const provider = getPaymentProvider();
  const t = await getT();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-3xl font-semibold text-earth-900">{t("customerNav.checkout")}</h1>
      <CheckoutFlow
        addresses={addresses.map((a) => ({ id: a.id, label: `${a.fullName}, ${a.line1}${a.line2 ? ", " + a.line2 : ""}, ${a.city}, ${a.state} ${a.pincode}`, phone: a.phone }))}
        items={items.map((i) => ({ name: i.product.name, quantity: i.quantity, line: i.product.pricePaise * i.quantity, image: i.product.images[0]?.url ?? "" }))}
        totals={{ STANDARD: priceCart(items, "STANDARD"), EXPRESS: priceCart(items, "EXPRESS") }}
        mockPayments={provider.isMock}
      />
    </div>
  );
}
