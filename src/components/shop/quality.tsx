import { CheckCircle2, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getT } from "@/i18n/server";

/** "Quality Verification" box — wording deliberately avoids certification/purity claims. */
export async function QualityVerification({ reviewedAt, testedAt, procuredAt }: { reviewedAt?: Date | null; testedAt?: Date | null; procuredAt?: Date | null }) {
  const t = await getT();
  const rows = [
    [t("quality.reviewed"), t("quality.reviewedText"), reviewedAt],
    [t("quality.tested"), t("quality.testedText"), testedAt],
    [t("quality.procured"), t("quality.procuredText"), procuredAt],
    [t("quality.inventory"), t("quality.inventoryText"), null],
  ] as const;
  return (
    <section className="rounded-2xl border border-leaf-200 bg-leaf-50/60 p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-leaf-800 uppercase">
        <ShieldCheck className="size-5" /> {t("quality.title")}
      </h2>
      <ul className="mt-3 space-y-2.5">
        {rows.map(([title, text, date]) => (
          <li key={title} className="flex gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-leaf-600" />
            <div className="text-sm">
              <p className="font-semibold text-earth-900">
                ✓ {title} {date && <span className="font-normal text-muted">· {formatDate(date)}</span>}
              </p>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-white px-3 py-2 text-xs text-earth-700">
        <strong>{t("quality.passed")}</strong> {t("quality.disclaimer")}
      </p>
    </section>
  );
}

export async function TraceabilityTable(props: {
  milletType: string;
  farmer: string;
  village: string;
  district: string;
  state: string;
  harvestYear: number;
  batch: string;
  testCode?: string | null;
  available: boolean;
}) {
  const t = await getT();
  const rows: Array<[string, string]> = [
    [t("trace.millet"), t(`labels.millet.${props.milletType}`)],
    [t("trace.farmer"), props.farmer],
    [t("trace.village"), props.village],
    [t("trace.district"), props.district],
    [t("trace.state"), props.state],
    [t("trace.harvest"), String(props.harvestYear)],
    [t("trace.batch"), props.batch],
    [t("trace.adminReview"), t("trace.passed")],
    [t("trace.physicalTesting"), props.testCode ? t("trace.passedCode", { code: props.testCode }) : t("trace.passed")],
    [t("trace.procurement"), t("trace.completed")],
    [t("trace.marketplace"), props.available ? t("trace.available") : t("trace.soldOut")],
  ];
  return (
    <section className="card p-5">
      <h2 className="text-sm font-bold tracking-widest text-earth-700 uppercase">{t("trace.title")}</h2>
      <dl className="mt-3 divide-y divide-dashed divide-earth-100 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-semibold text-earth-900">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
