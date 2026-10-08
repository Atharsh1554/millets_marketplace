import { ProfileView } from "@/components/account/account-views";
import { requirePageRole } from "@/server/auth/guard";

export default async function ProfilePage() {
  const user = await requirePageRole(["QUALITY_TEAM"]);
  return <ProfileView user={user} />;
}
