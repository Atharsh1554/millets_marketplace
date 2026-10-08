import { BadgeIndianRupee, ClipboardCheck, FlaskConical, ShoppingBag, Sprout, Store, Warehouse } from "lucide-react";
import { getT } from "@/i18n/server";

const HOW_STEPS = [
  { icon: Sprout, key: "s1" },
  { icon: ClipboardCheck, key: "s2" },
  { icon: FlaskConical, key: "s3" },
  { icon: Warehouse, key: "s4" },
  { icon: Store, key: "s5" },
  { icon: ShoppingBag, key: "s6" },
  { icon: BadgeIndianRupee, key: "s7" },
] as const;

export async function HowItWorks() {
  const t = await getT();
  return (
    <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {HOW_STEPS.map((s, i) => (
        <li key={s.key} className="card relative flex flex-col gap-2 p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-leaf-700 text-millet-200">
              <s.icon className="size-5" />
            </span>
            <span className="font-display text-3xl font-semibold text-earth-100">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <p className="text-[11px] font-bold tracking-widest text-millet-600 uppercase">{t("how.step", { n: i + 1 })}</p>
          <h3 className="font-semibold text-earth-900">{t(`how.${s.key}.title`)}</h3>
          <p className="text-sm text-muted">{t(`how.${s.key}.text`)}</p>
        </li>
      ))}
    </ol>
  );
}
