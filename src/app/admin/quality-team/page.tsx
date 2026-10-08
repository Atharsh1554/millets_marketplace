import { Card, CardHeader, DemoBadge, PageHeader } from "@/components/ui";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/forms";
import { createStaffAction } from "@/app/actions/operations";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";

export default async function QualityTeamPage() {
  await requirePageRole(["ADMIN"]);
  const staff = await db.user.findMany({
    where: { role: { in: ["QUALITY_TEAM", "ADMIN"] } },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isDemo: true,
      createdAt: true,
      _count: { select: { physicalTests: true, sampleCollections: true } },
      physicalTests: { where: { status: { in: ["PASSED", "FAILED"] } }, select: { status: true } },
    },
  });
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Quality Team" subtitle="Quality team members and their inspection activity. Quality team and admin accounts can only be created here — public sign-up is limited to customers and farmers." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="table-wrap h-fit">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Samples collected</th>
                <th>Inspections</th>
                <th>Passed / Failed</th>
                <th>Since</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">
                    {s.name} {s.isDemo && <DemoBadge />}
                  </td>
                  <td className="text-xs">
                    {s.email}
                    <p className="text-muted">{s.phone}</p>
                  </td>
                  <td>{ROLE_LABEL[s.role]}</td>
                  <td>{s._count.sampleCollections}</td>
                  <td>{s._count.physicalTests}</td>
                  <td>
                    {s.physicalTests.filter((t) => t.status === "PASSED").length} / {s.physicalTests.filter((t) => t.status === "FAILED").length}
                  </td>
                  <td className="text-xs">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card className="h-fit">
          <CardHeader title="Add staff member" />
          <ActionForm action={createStaffAction} resetOnSuccess className="space-y-3 p-5">
            <TextField label="Name" name="name" required />
            <TextField label="Email" name="email" type="email" required />
            <TextField label="Phone" name="phone" type="tel" required />
            <SelectField label="Role" name="role" options={[["QUALITY_TEAM", "Quality Team"], ["ADMIN", "Admin"]]} />
            <TextField label="Temporary password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <SubmitButton className="w-full">Create account</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
