"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Package, Heart, Bell, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useT } from "@/i18n/client";
import { LanguageSelector } from "./language-selector";

export function MobileMenu({ nav, dashboard, signedIn }: { nav: Array<{ href: string; label: string }>; dashboard?: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);
  return (
    <>
      <button className="-ml-2 rounded-lg p-2 text-earth-800 lg:hidden" onClick={() => setOpen(true)} aria-label={t("common.navigation.openMenu")}>
        <Menu className="size-6" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-earth-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.nav
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-1 bg-cream p-5 shadow-xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <button className="mb-4 self-end rounded-lg p-2" onClick={() => setOpen(false)} aria-label={t("common.navigation.closeMenu")}>
                <X className="size-5" />
              </button>
              <div className="mb-3 px-1 sm:hidden">
                <p className="mb-1.5 text-xs font-semibold text-earth-500">{t("common.language.label")}</p>
                <LanguageSelector variant="segmented" />
              </div>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-xl px-3 py-3 font-medium text-earth-800 hover:bg-white">
                  {n.label}
                </Link>
              ))}
              {dashboard && (
                <Link href={dashboard} className="mt-2 flex items-center gap-2 rounded-xl bg-leaf-700 px-3 py-3 font-semibold text-white">
                  <LayoutDashboard className="size-4" /> {t("common.navigation.myDashboard")}
                </Link>
              )}
              {!signedIn && (
                <Link href="/register" className="mt-2 rounded-xl border border-earth-200 px-3 py-3 text-center font-semibold text-earth-800">
                  {t("common.navigation.createAccount")}
                </Link>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function UserMenu({ name, role, isCustomer, dashboard }: { name: string; role: string; isCustomer: boolean; dashboard?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div ref={ref} className="relative ml-1">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-xl p-1 pr-2 hover:bg-earth-50" aria-expanded={open}>
        <span className="grid size-8 place-items-center rounded-full bg-millet-200 text-xs font-bold text-earth-900">{initials}</span>
        <ChevronDown className="size-4 text-earth-500" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 mt-2 w-60 rounded-2xl border border-earth-100 bg-white p-2 shadow-[var(--shadow-lift)]"
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-earth-900">{name}</p>
              <p className="text-xs text-muted">{role}</p>
            </div>
            <hr className="my-1 border-earth-100" />
            {dashboard && <MenuLink href={dashboard} icon={<LayoutDashboard className="size-4" />}>{t("common.navigation.dashboard")}</MenuLink>}
            {isCustomer && (
              <>
                <MenuLink href="/customer/orders" icon={<Package className="size-4" />}>{t("common.navigation.myOrders")}</MenuLink>
                <MenuLink href="/customer/wishlist" icon={<Heart className="size-4" />}>{t("common.navigation.wishlist")}</MenuLink>
              </>
            )}
            <MenuLink href={`${dashboard ?? ""}/notifications`} icon={<Bell className="size-4" />}>{t("common.navigation.notifications")}</MenuLink>
            <form action={logoutAction}>
              <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">
                <LogOut className="size-4" /> {t("common.navigation.signOut")}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-earth-800 hover:bg-cream">
      {icon}
      {children}
    </Link>
  );
}
