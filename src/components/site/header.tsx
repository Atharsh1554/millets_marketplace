import Link from "next/link";
import { Bell, Heart, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { getCurrentUser } from "@/server/auth/guard";
import { cartCount } from "@/server/services/shop";
import { unreadCount } from "@/server/services/notifications";
import { getT } from "@/i18n/server";
import { DemoBanner, Logo } from "./brand";
import { MobileMenu, UserMenu } from "./header-client";
import { LanguageSelector } from "./language-selector";
import { ROLE_HOME } from "@/lib/roles";
import { cn } from "@/lib/format";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const t = await getT();
  const [cart, unread] = user ? await Promise.all([user.role === "CUSTOMER" ? cartCount(user.id) : 0, unreadCount(user.id)]) : [0, 0];
  const dashboard = user ? ROLE_HOME[user.role] : undefined;
  const nav = [
    { href: "/shop", label: t("common.navigation.shop") },
    { href: "/how-it-works", label: t("common.navigation.howItWorks") },
    { href: "/traceability", label: t("common.navigation.traceability") },
    { href: "/sell", label: t("common.navigation.sellHarvest") },
  ];

  return (
    <header className="sticky top-0 z-40">
      <DemoBanner />
      <div className="border-b border-earth-100 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <MobileMenu nav={nav} dashboard={dashboard} signedIn={!!user} />
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-earth-700 hover:bg-earth-50 hover:text-earth-900">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {/* On phones the selector lives in the menu drawer to keep the bar from overflowing. */}
            <div className="hidden sm:block">
              <LanguageSelector className="mr-1" />
            </div>
            {dashboard && (
              <Link href={dashboard} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50 sm:flex">
                <LayoutDashboard className="size-4" /> {t("common.navigation.dashboard")}
              </Link>
            )}
            {user && (
              <Link href={`${dashboard}/notifications`} className="relative rounded-lg p-2 text-earth-700 hover:bg-earth-50" aria-label={t("common.navigation.notificationsUnread", { count: unread })}>
                <Bell className="size-5" />
                {unread > 0 && <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
              </Link>
            )}
            {/* Guests on phones: the Sign in button covers it (the cart needs an account). */}
            {(!user || user.role === "CUSTOMER") && (
              <>
                <Link href="/customer/wishlist" className="hidden rounded-lg p-2 text-earth-700 hover:bg-earth-50 sm:block" aria-label={t("common.navigation.wishlist")}>
                  <Heart className="size-5" />
                </Link>
                <Link href="/customer/cart" className={cn("relative rounded-lg p-2 text-earth-700 hover:bg-earth-50", !user && "hidden sm:block")} aria-label={t("common.navigation.cartItems", { count: cart })}>
                  <ShoppingBag className="size-5" />
                  {cart > 0 && <span className="absolute top-1 right-0.5 grid min-w-4 place-items-center rounded-full bg-millet-400 px-1 text-[10px] font-bold text-earth-900">{cart}</span>}
                </Link>
              </>
            )}
            {user ? (
              <UserMenu name={user.name} role={t(`roles.${user.role}`)} isCustomer={user.role === "CUSTOMER"} dashboard={dashboard} />
            ) : (
              <Link href="/login" className="ml-1 flex items-center gap-1.5 rounded-xl bg-leaf-700 px-3 py-2 sm:px-3.5 text-sm font-semibold whitespace-nowrap text-white hover:bg-leaf-800">
                <User className="hidden size-4 sm:block" /> {t("common.navigation.signIn")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
