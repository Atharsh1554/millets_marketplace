"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeIndianRupee,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  Home,
  ListChecks,
  Package,
  PackageCheck,
  ShoppingCart,
  Sprout,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Bell,
  BadgeCheck,
  Boxes,
  CircleCheck,
  CircleX,
  ClipboardPen,
  CreditCard,
  FileUp,
  Heart,
  History,
  IndianRupee,
  Layers,
  MessageSquareWarning,
  Microscope,
  PackagePlus,
  RotateCcw,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Tags,
  Tractor,
  TrendingUp,
  UserCheck,
  UserRound,
  Wrench,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/format";

const ICONS = {
  BadgeIndianRupee, BarChart3, ClipboardCheck, ClipboardList, FileText, FlaskConical, Home, ListChecks, Package,
  PackageCheck, ShoppingCart, Sprout, Store, Truck, UserCog, Users, Wallet, Warehouse,
  Bell, BadgeCheck, Boxes, CircleCheck, CircleX, ClipboardPen, CreditCard, FileUp, Heart, History, IndianRupee, Layers, MessageSquareWarning, Microscope, PackagePlus, RotateCcw, ScrollText, Search, Settings, ShieldCheck, SlidersHorizontal, Star, Tags, Tractor, TrendingUp, UserCheck, UserRound, Wrench, MessageSquare,
} satisfies Record<string, LucideIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean; group?: string };

/** Sidebar on desktop, horizontal scroller on mobile. Icons are passed by name (server → client). */
export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const matches = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));
  // Highlight only the most specific match (e.g. /admin/hardware/enquiries, not also /admin/hardware).
  const best = items.filter(matches).sort((x, y) => y.href.length - x.href.length)[0];
  const active = (i: NavItem) => i === best;
  return (
    <aside className="border-b border-earth-100 bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
      <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:p-4">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon];
          const showGroup = item.group && item.group !== items[i - 1]?.group;
          return (
            <div key={item.href} className="contents">
              {showGroup && <p className="mt-4 mb-1 hidden px-3 text-[11px] font-semibold tracking-widest text-earth-400 uppercase lg:block">{item.group}</p>}
              <Link
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition",
                  active(item) ? "bg-leaf-700 text-white shadow-sm" : "text-earth-700 hover:bg-cream",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
