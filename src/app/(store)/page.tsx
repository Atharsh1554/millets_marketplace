import Link from "next/link";
import { ArrowRight, ClipboardCheck, FlaskConical, MapPin, ScanSearch, ShieldCheck, Sprout, Tractor } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { FadeUp } from "@/components/site/hero";
import { HowItWorks } from "@/components/site/how-it-works";
import { ProductCard } from "@/components/shop/product-card";
import { getCurrentUser } from "@/server/auth/guard";
import { categoryCounts, featuredProducts } from "@/server/services/catalog";
import { wishlistProductIds } from "@/server/services/shop";
import { getT } from "@/i18n/server";

const CATEGORY_CARDS = [
  { id: "finger", href: "/shop?millet=FINGER_MILLET", key: "FINGER_MILLET", img: "/products/finger-millet.svg" },
  { id: "pearl", href: "/shop?millet=PEARL_MILLET", key: "PEARL_MILLET", img: "/products/pearl-millet.svg" },
  { id: "foxtail", href: "/shop?millet=FOXTAIL_MILLET", key: "FOXTAIL_MILLET", img: "/products/foxtail-millet.svg" },
  { id: "little", href: "/shop?millet=LITTLE_MILLET", key: "LITTLE_MILLET", img: "/products/little-millet.svg" },
  { id: "kodo", href: "/shop?millet=KODO_MILLET", key: "KODO_MILLET", img: "/products/kodo-millet.svg" },
  { id: "barnyard", href: "/shop?millet=BARNYARD_MILLET", key: "BARNYARD_MILLET", img: "/products/barnyard-millet.svg" },
  { id: "proso", href: "/shop?millet=PROSO_MILLET", key: "PROSO_MILLET", img: "/products/proso-millet.svg" },
  { id: "browntop", href: "/shop?millet=BROWNTOP_MILLET", key: "BROWNTOP_MILLET", img: "/products/browntop-millet.svg" },
  { id: "flour", href: "/shop?category=FLOUR", cat: "FLOUR", img: "/products/millet-flour.svg" },
  { id: "snacks", href: "/shop?category=SNACKS", cat: "SNACKS", img: "/products/millet-snacks.svg" },
  { id: "mixes", href: "/shop?category=READY_MIX", cat: "READY_MIX", img: "/products/millet-mix.svg" },
] as const;

const TRUST = [
  { icon: Sprout, key: "farmerSourced" },
  { icon: ClipboardCheck, key: "adminReviewed" },
  { icon: FlaskConical, key: "physicallyTested" },
  { icon: ScanSearch, key: "qualityTracked" },
] as const;

export default async function HomePage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const [featured, counts, wish] = await Promise.all([
    featuredProducts(8),
    categoryCounts(),
    user?.role === "CUSTOMER" ? wishlistProductIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-leaf-800 text-white">
        <div className="grain-bg absolute inset-0 opacity-30" aria-hidden />
        <div className="absolute -top-32 -right-32 size-[520px] rounded-full bg-millet-400/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_.9fr]">
          <FadeUp>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-millet-200 ring-1 ring-white/15">
              <ShieldCheck className="size-3.5" /> {t("home.badge")}
            </p>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl">
              {t("home.heroLine1")} <br className="hidden sm:block" />
              {t("home.heroTo")} <span className="text-millet-300">{t("home.heroFamily")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-leaf-100">{t("home.heroText")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/shop" variant="gold" size="lg">
                {t("common.actions.shopMillet")} <ArrowRight className="size-5" />
              </LinkButton>
              <LinkButton href="/sell" size="lg" className="bg-white/10 ring-1 ring-white/25 hover:bg-white/20">
                <Tractor className="size-5" /> {t("common.navigation.sellHarvest")}
              </LinkButton>
            </div>
          </FadeUp>
          <FadeUp delay={0.15} className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] shadow-2xl ring-8 ring-white/10">
              <img src="/products/finger-millet.svg" alt={t("home.heroImageAlt")} className="size-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-4 rounded-2xl bg-white p-4 text-earth-900 shadow-xl sm:-left-10">
              <p className="text-xs font-semibold text-muted">{t("trace.batch")} MM-{new Date().getFullYear()}-001</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold"><MapPin className="size-4 text-leaf-700" /> Kolar, Karnataka</p>
              <p className="mt-2 flex gap-1 text-[11px] font-semibold text-leaf-700">
                <span className="rounded-full bg-leaf-50 px-2 py-0.5">✓ {t("home.reviewed")}</span>
                <span className="rounded-full bg-leaf-50 px-2 py-0.5">✓ {t("home.tested")}</span>
                <span className="rounded-full bg-leaf-50 px-2 py-0.5">✓ {t("home.procured")}</span>
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-b border-earth-100 bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-4">
          {TRUST.map((item) => (
            <li key={item.key} className="flex items-center justify-center gap-2.5 text-sm font-semibold text-earth-800">
              <span className="grid size-9 place-items-center rounded-full bg-leaf-50 text-leaf-700">
                <item.icon className="size-4.5" />
              </span>
              ✓ {t(`home.trust.${item.key}`)}
            </li>
          ))}
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <FadeUp className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold tracking-widest text-millet-600 uppercase">{t("home.howEyebrow")}</p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-earth-900 sm:text-4xl">{t("home.howTitle")}</h2>
          <p className="mt-2 text-muted">{t("home.howText")}</p>
        </FadeUp>
        <HowItWorks />
      </section>

      {/* CATEGORIES */}
      <section className="bg-cream-dark/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold text-earth-900">{t("home.shopByMillet")}</h2>
            <Link href="/shop" className="text-sm font-semibold text-leaf-700 hover:underline">{t("home.viewAllProducts")} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORY_CARDS.map((c) => {
              const n = "key" in c ? (counts.millet[c.key] ?? 0) : (counts.category[c.cat] ?? 0);
              return (
                <Link key={c.id} href={c.href} className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                  <div className="aspect-[4/3] overflow-hidden bg-cream">
                    <img src={c.img} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-earth-900">{t(`home.cat.${c.id}.title`)}</p>
                    <p className="text-xs text-muted">
                      {t(`home.cat.${c.id}.sub`)} · {t(n === 1 ? "home.oneProduct" : "home.nProducts", { count: n })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-earth-900">{t("home.featuredTitle")}</h2>
            <p className="mt-1 text-muted">{t("home.featuredText")}</p>
          </div>
          <LinkButton href="/shop" variant="outline">{t("home.browseMarketplace")}</LinkButton>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} p={p} signedIn={user?.role === "CUSTOMER"} wishlisted={wish.has(p.id)} />
          ))}
        </div>
      </section>

      {/* FARMER CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-earth-800 px-6 py-12 text-white sm:px-12">
          <div className="grain-bg absolute inset-0 opacity-25" aria-hidden />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-semibold tracking-widest text-millet-300 uppercase">{t("home.forFarmers")}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{t("home.ctaTitle")}</h2>
              <p className="mt-3 max-w-xl text-earth-100">{t("home.ctaText")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/sell" variant="gold" size="lg">{t("farmer.submitHarvest")} <ArrowRight className="size-5" /></LinkButton>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {(["b1", "b2", "b3", "b4"] as const).map((k) => (
                <li key={k} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                  <ShieldCheck className="size-5 text-millet-300" /> {t(`home.cta.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TRACEABILITY TEASER */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-earth-900">{t("home.traceTitle")}</h2>
            <p className="mt-3 text-muted">{t("home.traceText")}</p>
            <LinkButton href="/traceability" variant="outline" className="mt-5">{t("home.traceButton")}</LinkButton>
          </div>
          <div className="card p-6 font-mono text-sm">
            <p className="mb-3 font-sans text-xs font-bold tracking-widest text-millet-600 uppercase">{t("trace.title")}</p>
            {[
              [t("trace.millet"), t("labels.millet.FINGER_MILLET")],
              [t("trace.farmer"), "Lakshmi Devi (Demo)"],
              [t("home.villageDistrict"), "Kolar, Kolar"],
              [t("trace.state"), "Karnataka"],
              [t("trace.batch"), `MM-${new Date().getFullYear()}-001`],
              [t("trace.adminReview"), t("trace.passed")],
              [t("trace.physicalTesting"), t("trace.passed")],
              [t("trace.procurement"), t("trace.completed")],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-dashed border-earth-100 py-1.5">
                <span className="text-muted">{k}</span>
                <span className="font-semibold text-earth-900">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
