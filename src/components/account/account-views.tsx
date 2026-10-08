import type { ReactNode } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import type { CurrentUser } from "@/server/auth/guard";
import { getT } from "@/i18n/server";
import { PasswordForm, ProfileForm } from "./account-forms";

/** Profile page body — shared by every role's dashboard. */
export async function ProfileView({ user, children }: { user: CurrentUser; children?: ReactNode }) {
  const t = await getT();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("account.profileTitle")} subtitle={t("account.profileSubtitle")} />
      <Card>
        <CardHeader title={t("account.personalDetails")} icon={UserRound} />
        <div className="p-5">
          <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} role={t(`roles.${user.role}`)} />
        </div>
      </Card>
      {children}
    </div>
  );
}

/** Settings page body — password plus optional role-specific sections. */
export async function SettingsView({ children }: { children?: ReactNode }) {
  const t = await getT();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("account.settingsTitle")} subtitle={t("account.settingsSubtitle")} />
      <Card>
        <CardHeader title={t("account.changePassword")} icon={KeyRound} />
        <div className="p-5">
          <PasswordForm />
        </div>
      </Card>
      {children}
    </div>
  );
}
