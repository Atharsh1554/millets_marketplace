import { Card, CardHeader, Notice, PageHeader } from "@/components/ui";
import { ActionButton, ActionForm, SubmitButton, TextField } from "@/components/forms";
import { addChecklistItemAction, toggleChecklistItemAction } from "@/app/actions/testing";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { cn } from "@/lib/format";

export default async function ChecklistPage() {
  await requirePageRole(["ADMIN"]);
  const items = await db.testChecklistItem.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Physical Testing Checklist" subtitle="Configure the items the quality team must record for every physical test. A harvest can pass only when every active item is marked Pass." />
      <div className="mb-6">
        <Notice tone="gold" title="Not a laboratory certification">
          These are physical/visual checks. If laboratory testing is added later, it should be a separate, optional module with its own records and certificates.
        </Notice>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <ul className="divide-y divide-earth-100">
            {items.map((i) => (
              <li key={i.id} className={cn("flex items-center justify-between gap-3 px-5 py-3", !i.active && "opacity-50")}>
                <div>
                  <p className="font-semibold text-earth-900">{i.sortOrder + 1}. {i.name}</p>
                  {i.description && <p className="text-xs text-muted">{i.description}</p>}
                </div>
                <ActionButton action={toggleChecklistItemAction} fields={{ id: i.id }} variant={i.active ? "outline" : "primary"}>
                  {i.active ? "Disable" : "Enable"}
                </ActionButton>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-fit">
          <CardHeader title="Add checklist item" />
          <ActionForm action={addChecklistItemAction} resetOnSuccess className="space-y-3 p-5">
            <TextField label="Name" name="name" required placeholder="e.g. Grain hardness" />
            <TextField label="Description" name="description" />
            <TextField label="Sort order" name="sortOrder" type="number" min={0} defaultValue={items.length} />
            <SubmitButton className="w-full">Add item</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
