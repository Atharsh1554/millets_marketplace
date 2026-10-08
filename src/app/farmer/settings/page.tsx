import { SettingsView } from "@/components/account/account-views";
import { requirePageRole } from "@/server/auth/guard";

export default async function SettingsPage() {
  await requirePageRole(["FARMER"]);
  return <SettingsView />;
}
