import { NotificationsView } from "@/components/account/notifications-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function NotificationsPage() {
  const user = await requirePageRole(["QUALITY_TEAM"]);
  return <NotificationsView userId={user.id} />;
}
