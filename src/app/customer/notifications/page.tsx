import { NotificationsView } from "@/components/account/notifications-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function NotificationsPage() {
  const user = await requirePageRole(["CUSTOMER"]);
  return <NotificationsView userId={user.id} />;
}
