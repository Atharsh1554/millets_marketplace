import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList, Cog, MessageSquare, Phone, Sparkles, Users } from "lucide-react";
import { Card, CardHeader, Notice, buttonClass } from "@/components/ui";
import { EnquiryForm } from "@/components/hardware/enquiry-form";
import { requirePageRole } from "@/server/auth/guard";
import { HARDWARE_PLACEHOLDER, lines, publishedHardwareBySlug, specRows } from "@/server/services/hardware";
import { orgContactPhone, telHref } from "@/server/org";
import { getT } from "@/i18n/server";

export default async function HardwareDetailsPage({ params }: PageProps<"/farmer/hardware/[slug]">) {
  const user = await requirePageRole(["FARMER"]);
  const t = await getT();
  const product = await publishedHardwareBySlug((await params).slug);
  if (!product) notFound();
  const phone = orgContactPhone();
  const images = product.images.length ? product.images : [{ id: "placeholder", url: HARDWARE_PLACEHOLDER[product.category], alt: product.name }];
  const steps = lines(product.howItWorks);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/farmer/hardware" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-earth-600 hover:text-earth-900">
        <ArrowLeft className="size-4" /> {t("hardware.back")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <img src={images[0].url} alt={images[0].alt} className="aspect-[4/3] w-full rounded-3xl bg-cream-dark object-cover" />
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt={img.alt} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold tracking-widest text-millet-600 uppercase">{t(`labels.hardwareCategory.${product.category}`)}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-earth-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-lg text-earth-700">{product.description}</p>
          </div>
          <p className="flex items-start gap-2 rounded-2xl bg-leaf-50 p-4 text-leaf-800 ring-1 ring-leaf-200">
            <Sparkles className="mt-0.5 size-5 shrink-0" />
            <span>
              <span className="font-semibold">{t("hardware.mainBenefit")}: </span>
              {product.mainBenefit}
            </span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="#enquire" className={buttonClass("primary", "lg", "w-full")}>
              <MessageSquare className="size-5" /> {t("common.actions.enquireNow")}
            </a>
            {phone ? (
              <a href={telHref(phone)} className={buttonClass("gold", "lg", "w-full")}>
                <Phone className="size-5" /> {t("common.actions.callNow")}
              </a>
            ) : (
              <span className={buttonClass("outline", "lg", "w-full opacity-60")} aria-disabled>
                <Phone className="size-5" /> {t("common.actions.callNow")}
              </span>
            )}
          </div>
          {phone ? (
            <p className="text-sm text-muted">{t("hardware.callText", { phone })}</p>
          ) : (
            <p className="text-sm text-muted">{t("hardware.callUnavailable")}</p>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={t("hardware.overview")} icon={ClipboardList} />
            <div className="space-y-3 p-5 text-earth-800">
              {product.overview.split(/\r?\n\s*\r?\n|\r?\n/).filter(Boolean).map((para, i) => (
                <p key={i} className="leading-relaxed">{para}</p>
              ))}
            </div>
          </Card>

          <Card id="how-it-works" className="scroll-mt-24 border-2 border-leaf-200">
            <CardHeader title={t("hardware.howItWorks")} subtitle={t("hardware.howItWorksIntro")} icon={Cog} />
            <ol className="space-y-4 p-5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf-700 text-base font-bold text-white">{i + 1}</span>
                  <div className="pt-1">
                    <p className="text-xs font-semibold tracking-wide text-millet-600 uppercase">{t("hardware.step", { n: i + 1 })}</p>
                    <p className="mt-0.5 text-base leading-relaxed text-earth-900">{s}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <ListCard title={t("hardware.features")} items={lines(product.features)} />
            <ListCard title={t("hardware.benefits")} items={lines(product.benefits)} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t("hardware.specifications")} />
            <dl className="divide-y divide-dashed divide-earth-100 px-5 py-2 text-sm">
              {specRows(product.specifications).map(([k, v], i) => (
                <div key={i} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold text-earth-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title={t("hardware.suitableFor")} icon={Users} />
            <ul className="space-y-2 p-5 text-sm text-earth-800">
              {lines(product.suitableFor).map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-millet-400" /> {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <section id="enquire" className="mt-10 scroll-mt-24">
        <Card>
          <CardHeader title={t("hardware.enquireTitle")} subtitle={t("hardware.enquireSubtitle")} icon={MessageSquare} />
          <div className="space-y-4 p-5">
            <EnquiryForm productId={product.id} defaultName={user.name} defaultPhone={user.phone ?? ""} />
            {phone && (
              <Notice tone="gold" icon={Phone} title={t("hardware.callTitle")}>
                <a href={telHref(phone)} className="font-semibold underline">
                  {t("common.actions.callNow")}: {phone}
                </a>
              </Notice>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="space-y-2 p-5 text-sm text-earth-800">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-600" /> {s}
          </li>
        ))}
      </ul>
    </Card>
  );
}
