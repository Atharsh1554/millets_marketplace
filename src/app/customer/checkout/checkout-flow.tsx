"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, FlaskConical, MapPin, Smartphone, Truck, Zap } from "lucide-react";
import { placeOrderAction } from "@/app/actions/shop";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AddressFields } from "@/components/account/account-forms";
import { useT } from "@/i18n/client";
import { Stepper } from "@/components/timeline";
import { Button, Notice } from "@/components/ui";
import { cn, formatINR } from "@/lib/format";

type Totals = { subtotal: number; discount: number; delivery: number; total: number };

export function CheckoutFlow({
  addresses,
  items,
  totals,
  mockPayments,
}: {
  addresses: Array<{ id: string; label: string; phone: string }>;
  items: Array<{ name: string; quantity: number; line: number; image: string }>;
  totals: Record<"STANDARD" | "EXPRESS", Totals>;
  mockPayments: boolean;
}) {
  const router = useRouter();
  const tr = useT();
  const STEPS = [tr("checkout.stepAddress"), tr("checkout.stepDelivery"), tr("checkout.stepPayment"), tr("checkout.stepReview"), tr("checkout.stepConfirm")];
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [adding, setAdding] = useState(addresses.length === 0);
  const [delivery, setDelivery] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [payment, setPayment] = useState<"UPI" | "CARD" | "COD">("UPI");
  const t = totals[delivery];
  const address = addresses.find((a) => a.id === addressId);

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} current={step} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="card p-5 sm:p-6">
          {step === 0 && (
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 font-semibold text-earth-900">
                <MapPin className="size-5 text-leaf-700" /> {tr("checkout.address")}
              </h2>
              {addresses.map((a) => (
                <Choice key={a.id} checked={addressId === a.id} onSelect={() => setAddressId(a.id)} title={a.label} sub={a.phone} />
              ))}
              {adding ? (
                <AddressFields
                  onSaved={(id) => {
                    setAddressId(id);
                    setAdding(false);
                    router.refresh();
                  }}
                  onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
                />
              ) : (
                <Button variant="outline" onClick={() => setAdding(true)}>
                  {tr("account.addNewAddress")}
                </Button>
              )}
              <Nav onNext={() => setStep(1)} nextDisabled={!addressId || adding} />
            </section>
          )}

          {step === 1 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-semibold text-earth-900">
                <Truck className="size-5 text-leaf-700" /> {tr("checkout.deliveryMethod")}
              </h2>
              <Choice checked={delivery === "STANDARD"} onSelect={() => setDelivery("STANDARD")} icon={Truck} title={tr("checkout.standard")} sub={totals.STANDARD.delivery === 0 ? tr("checkout.freeOnOrder") : formatINR(totals.STANDARD.delivery)} />
              <Choice checked={delivery === "EXPRESS"} onSelect={() => setDelivery("EXPRESS")} icon={Zap} title={tr("checkout.express")} sub={formatINR(totals.EXPRESS.delivery)} />
              <p className="text-xs text-muted">{tr("checkout.warehouseNote")}</p>
              <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </section>
          )}

          {step === 2 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-earth-900">{tr("checkout.stepPayment")}</h2>
              {mockPayments && (
                <Notice tone="gold" icon={FlaskConical} title={tr("checkout.mockTitle")}>
                  {tr("checkout.mockText")}
                </Notice>
              )}
              <Choice checked={payment === "UPI"} onSelect={() => setPayment("UPI")} icon={Smartphone} title={tr("labels.paymentMethod.UPI")} sub={tr("checkout.upiSub")} />
              <Choice checked={payment === "CARD"} onSelect={() => setPayment("CARD")} icon={CreditCard} title={tr("checkout.card")} sub={tr("checkout.cardSub")} />
              <Choice checked={payment === "COD"} onSelect={() => setPayment("COD")} icon={Banknote} title={tr("labels.paymentMethod.COD")} sub={tr("checkout.codSub")} />
              <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} />
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="font-semibold text-earth-900">{tr("checkout.reviewTitle")}</h2>
              <ul className="divide-y divide-earth-100">
                {items.map((i) => (
                  <li key={i.name} className="flex items-center gap-3 py-2 text-sm">
                    <img src={i.image} alt="" className="size-12 rounded-lg object-cover" />
                    <span className="flex-1">
                      {i.name} × {i.quantity}
                    </span>
                    <span className="font-semibold">{formatINR(i.line)}</span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <ReviewBox title={tr("checkout.deliverTo")} text={address?.label ?? "—"} />
                <ReviewBox title={tr("checkout.stepDelivery")} text={delivery === "STANDARD" ? tr("checkout.standardShort") : tr("checkout.expressShort")} />
                <ReviewBox title={tr("checkout.stepPayment")} text={`${tr(`labels.paymentMethod.${payment}`)}${mockPayments && payment !== "COD" ? ` (${tr("checkout.mock")})` : ""}`} />
              </div>
              <ActionForm action={placeOrderAction}>
                <input type="hidden" name="addressId" value={addressId} />
                <input type="hidden" name="deliveryMethod" value={delivery} />
                <input type="hidden" name="paymentMethod" value={payment} />
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    ← {tr("common.actions.back")}
                  </Button>
                  <SubmitButton size="lg">
                    {payment === "COD" ? tr("checkout.placeOrder") : tr(mockPayments ? "checkout.payDemo" : "checkout.pay", { amount: formatINR(t.total) })}
                  </SubmitButton>
                </div>
              </ActionForm>
            </section>
          )}
        </div>

        <aside className="card h-fit space-y-2 p-5 text-sm">
          <h2 className="font-semibold text-earth-900">{tr("checkout.summary")}</h2>
          <Row k={tr("cart.subtotal")} v={formatINR(t.subtotal)} />
          <Row k={tr("cart.discount")} v={`− ${formatINR(t.discount)}`} className="text-leaf-700" />
          <Row k={tr("cart.delivery")} v={t.delivery === 0 ? tr("common.misc.free") : formatINR(t.delivery)} />
          <Row k={tr("common.misc.total")} v={formatINR(t.total)} className="border-t border-earth-100 pt-2 text-base font-bold text-earth-900" />
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, className }: { k: string; v: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

function ReviewBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-cream p-3">
      <p className="text-xs font-semibold text-muted">{title}</p>
      <p className="mt-0.5 text-earth-900">{text}</p>
    </div>
  );
}

function Choice({ checked, onSelect, title, sub, icon: Icon }: { checked: boolean; onSelect: () => void; title: string; sub?: string; icon?: typeof Truck }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn("flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition", checked ? "border-leaf-600 bg-leaf-50" : "border-earth-100 hover:border-earth-200")}
    >
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", checked ? "border-leaf-600" : "border-earth-300")}>
        {checked && <span className="size-2.5 rounded-full bg-leaf-600" />}
      </span>
      {Icon && <Icon className="size-5 text-earth-600" />}
      <span>
        <span className="block text-sm font-semibold text-earth-900">{title}</span>
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
    </button>
  );
}

function Nav({ onBack, onNext, nextDisabled }: { onBack?: () => void; onNext: () => void; nextDisabled?: boolean }) {
  const tr = useT();
  return (
    <div className="flex justify-between pt-2">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          ← {tr("common.actions.back")}
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onNext} disabled={nextDisabled}>
        {tr("common.actions.continue")} →
      </Button>
    </div>
  );
}
