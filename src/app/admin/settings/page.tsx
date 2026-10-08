import Link from "next/link";
import { ListChecks, UserCog, UserRound } from "lucide-react";
import { Card, CardHeader, DetailList } from "@/components/ui";
import { SettingsView } from "@/components/account/account-views";
import { ProfileForm } from "@/components/account/account-forms";
import { requirePageRole } from "@/server/auth/guard";
import { getPaymentProvider } from "@/server/payments";
import { ROLE_LABEL } from "@/lib/labels";
import { orgContactPhone } from "@/server/org";

export default async function AdminSettingsPage() {
  const user = await requirePageRole(["ADMIN"]);
  const payments = getPaymentProvider();
  return (
    <SettingsView>
      <Card>
        <CardHeader title="Your profile" icon={UserRound} />
        <div className="p-5">
          <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} role={ROLE_LABEL[user.role]} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Platform configuration" subtitle="Read from environment variables on the server." />
        <div className="p-5">
          <DetailList
            cols={3}
            items={[
              ["Payment provider", `${payments.name}${payments.isMock ? " (development mock)" : ""}`],
              ["File storage", process.env.STORAGE_DRIVER ?? "local"],
              ["Demo mode banner", process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "On" : "Off"],
              ["Farmer \"Call Now\" number (ORG_CONTACT_PHONE)", orgContactPhone() ?? "Not set — Call Now is hidden"],
            ]}
          />
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/checklist" className="card flex items-center gap-3 p-5 hover:shadow-[var(--shadow-lift)]">
          <ListChecks className="size-6 text-leaf-700" />
          <span>
            <span className="block font-semibold text-earth-900">Testing checklist</span>
            <span className="text-sm text-muted">Configure physical quality parameters</span>
          </span>
        </Link>
        <Link href="/admin/quality-team" className="card flex items-center gap-3 p-5 hover:shadow-[var(--shadow-lift)]">
          <UserCog className="size-6 text-leaf-700" />
          <span>
            <span className="block font-semibold text-earth-900">Staff accounts</span>
            <span className="text-sm text-muted">Create quality team and admin users</span>
          </span>
        </Link>
      </div>
    </SettingsView>
  );
}
