import type { Metadata } from "next";
import { BadgeIndianRupee, Camera, ClipboardCheck, FlaskConical, Phone, Smartphone, Truck } from "lucide-react";
import { LinkButton, Notice } from "@/components/ui";
import { getCurrentUser } from "@/server/auth/guard";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Sell your millet harvest" };

const STEPS = [
  { icon: Smartphone, key: "s1" },
  { icon: Camera, key: "s2" },
  { icon: ClipboardCheck, key: "s3" },
  { icon: FlaskConical, key: "s4" },
  { icon: Truck, key: "s5" },
  { icon: BadgeIndianRupee, key: "s6" },
] as const;

export default async function SellPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const cta =
    user?.role === "FARMER"
      ? { href: "/farmer/submit", label: t("farmer.submitHarvest") }
      : user
        ? { href: "/register?role=FARMER", label: t("sell.registerFarmerAccount") }
        : { href: "/register?role=FARMER", label: t("sell.registerFarmer") };

  return (
    <div>
      <section className="bg-leaf-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-semibold tracking-widest text-millet-300 uppercase">{t("sell.eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{t("farmer.submitHarvest")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-leaf-100">{t("sell.intro")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href={cta.href} variant="gold" size="lg">{cta.label}</LinkButton>
            {!user && (
              <LinkButton href="/login?next=/farmer/submit" size="lg" className="bg-white/10 ring-1 ring-white/25 hover:bg-white/20">
                {t("sell.haveAccount")}
              </LinkButton>
            )}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.key} className="card flex gap-4 p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-millet-100 text-millet-700">
                <s.icon className="size-6" />
              </span>
              <div>
                <p className="text-xs font-bold text-millet-600 uppercase">{t("how.step", { n: i + 1 })}</p>
                <h2 className="font-semibold text-earth-900">{t(`sell.${s.key}.title`)}</h2>
                <p className="mt-1 text-sm text-muted">{t(`sell.${s.key}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Notice tone="success" icon={BadgeIndianRupee} title={t("sell.paymentTitle")}>
            {t("sell.paymentText")}
          </Notice>
          <Notice tone="info" icon={Phone} title={t("sell.helpTitle")}>
            {t("sell.helpText")}
          </Notice>
        </div>
      </section>
    </div>
  );
}
