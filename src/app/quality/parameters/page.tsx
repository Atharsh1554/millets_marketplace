import { CheckCircle2 } from "lucide-react";
import { Card, Notice, PageHeader } from "@/components/ui";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";

export default async function QualityParametersPage() {
  await requirePageRole(["QUALITY_TEAM"]);
  const items = await db.testChecklistItem.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Quality Parameters" subtitle="The physical checklist every inspection must record. Each item is marked Pass, Fail or Requires Review." />
      <div className="mb-4">
        <Notice tone="gold">These are physical/visual checks — not laboratory certification. The checklist is configured by an admin.</Notice>
      </div>
      <Card>
        <ul className="divide-y divide-earth-100">
          {items.map((i) => (
            <li key={i.id} className={`flex items-start gap-3 px-5 py-3 ${i.active ? "" : "opacity-50"}`}>
              <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-leaf-600" />
              <div>
                <p className="font-semibold text-earth-900">
                  {i.name} {!i.active && <span className="text-xs font-normal text-muted">(disabled)</span>}
                </p>
                {i.description && <p className="text-xs text-muted">{i.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
