import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, Store } from "lucide-react";
import type { CurrentUser } from "@/server/auth/guard";
import { unreadCount } from "@/server/services/notifications";
import { DemoBanner, Logo } from "./site/brand";
import { UserMenu } from "./site/header-client";
import { SideNav, type NavItem } from "./side-nav";
import { ROLE_HOME } from "@/lib/roles";
import { getT } from "@/i18n/server";
import { LanguageSelector } from "./site/language-selector";

export async function DashboardShell({ user, nav, title, children }: { user: CurrentUser; nav: NavItem[]; title: string; children: ReactNode }) {
  const [unread, t] = await Promise.all([unreadCount(user.id), getT()]);
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <header className="sticky top-0 z-30 border-b border-earth-100 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Logo />
          <span className="hidden rounded-lg bg-leaf-50 px-2 py-1 text-xs font-semibold text-leaf-800 sm:inline">{title}</span>
          <div className="ml-auto flex items-center gap-1">
            <LanguageSelector className="mr-1" />
            <Link href={user.role === "CUSTOMER" ? "/customer/shop" : "/shop"} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-earth-700 hover:bg-earth-50 sm:flex">
              <Store className="size-4" /> {t("common.navigation.marketplace")}
            </Link>
            <Link href={`${ROLE_HOME[user.role]}/notifications`} className="relative rounded-lg p-2 text-earth-700 hover:bg-earth-50" aria-label={t("common.navigation.notificationsUnread", { count: unread })}>
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
            </Link>
            <UserMenu name={user.name} role={t(`roles.${user.role}`)} isCustomer={user.role === "CUSTOMER"} dashboard={ROLE_HOME[user.role]} />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col lg:flex-row">
        <SideNav items={nav} />
        <main className="min-w-0 flex-1 bg-cream px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
