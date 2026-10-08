import { redirect } from "next/navigation";
import { requirePageRole } from "@/server/auth/guard";
import { ROLE_HOME } from "@/lib/roles";

/** Legacy URL: notifications now live inside each role's dashboard. */
export default async function NotificationsRedirect() {
  const user = await requirePageRole(["CUSTOMER", "FARMER", "QUALITY_TEAM", "ADMIN"], "/notifications");
  redirect(`${ROLE_HOME[user.role]}/notifications`);
}
