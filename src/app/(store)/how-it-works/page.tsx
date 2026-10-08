import type { Metadata } from "next";
import { HowItWorks } from "@/components/site/how-it-works";
import { LinkButton } from "@/components/ui";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "How it works" };

const ROLES = ["farmer", "admin", "quality", "customer"] as const;

export default async function HowItWorksPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold tracking-widest text-millet-600 uppercase">{t("howPage.eyebrow")}</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-earth-900">{t("home.howTitle")}</h1>
      <p className="mt-3 max-w-3xl text-muted">{t("howPage.intro")}</p>
      <div className="mt-10">
        <HowItWorks />
      </div>
      <h2 className="mt-14 font-display text-2xl font-semibold text-earth-900">{t("howPage.whoTitle")}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {ROLES.map((r) => (
          <div key={r} className="card p-5">
            <h3 className="font-semibold text-earth-900">{t(`howPage.roles.${r}.title`)}</h3>
            <p className="mt-1 text-sm text-muted">{t(`howPage.roles.${r}.text`)}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href="/shop">{t("common.actions.shopMillet")}</LinkButton>
        <LinkButton href="/sell" variant="outline">{t("common.navigation.sellHarvest")}</LinkButton>
      </div>
    </div>
  );
}
