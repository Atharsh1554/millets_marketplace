import Link from "next/link";
import { Bell } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { listNotifications } from "@/server/services/notifications";
import { formatDateTime, cn } from "@/lib/format";
import { getT } from "@/i18n/server";
import { translateMessage } from "@/i18n/translate";
import { MarkReadButton } from "./mark-read";

/** Notification list — shared by every role's dashboard. */
export async function NotificationsView({ userId }: { userId: string }) {
  const [items, t] = await Promise.all([listNotifications(userId, 100), getT()]);
  const unread = items.filter((i) => !i.read).length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("common.navigation.notifications")} subtitle={t("common.misc.unread", { count: unread })} action={unread > 0 ? <MarkReadButton /> : undefined} />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title={t("account.noNotifications")} />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const body = (
              <div className={cn("card flex gap-3 p-4 transition", !n.read && "border-l-4 border-l-millet-400", n.link && "hover:bg-cream")}>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-earth-200" : "bg-millet-400")} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-earth-900">{translateMessage(t, n.title)}</p>
                  <p className="text-sm text-earth-700">{translateMessage(t, n.message)}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link}>{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
