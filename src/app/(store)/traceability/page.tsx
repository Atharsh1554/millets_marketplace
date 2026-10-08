import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Timeline } from "@/components/timeline";
import { Notice } from "@/components/ui";
import { db } from "@/server/db";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Quality & traceability" };

export default async function TraceabilityPage() {
  const [checklist, t] = await Promise.all([db.testChecklistItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }), getT()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-earth-900">{t("tracePage.title")}</h1>
      <p className="mt-3 text-muted">{t("tracePage.intro")}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="card p-6">
          <Timeline
            steps={(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((k) => ({ label: t(`tracePage.${k}.title`), state: "done" as const, detail: t(`tracePage.${k}.text`) }))}
          />
        </div>
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-earth-900">{t("tracePage.checklistTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("tracePage.checklistText")}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {checklist.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-600" />
                  <span>
                    <span className="font-semibold text-earth-900">{t.has(`checklist.${c.name}.name`) ? t(`checklist.${c.name}.name`) : c.name}</span>
                    {c.description && (
                      <span className="block text-xs text-muted">{t.has(`checklist.${c.name}.description`) ? t(`checklist.${c.name}.description`) : c.description}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Notice tone="gold" icon={AlertTriangle} title={t("tracePage.noClaimTitle")}>
            {t("tracePage.noClaimText")}
          </Notice>
        </div>
      </div>
    </div>
  );
}
