import { DashboardShell } from "@/components/dashboard-shell";
import type { NavItem } from "@/components/side-nav";
import { requirePageRole } from "@/server/auth/guard";
import { getT } from "@/i18n/server";

export default async function CustomerLayout({ children }: LayoutProps<"/customer">) {
  const user = await requirePageRole(["CUSTOMER"], "/customer");
  const t = await getT();
  const g = { shop: t("customerNav.groupShop"), orders: t("customerNav.groupOrders"), account: t("customerNav.groupAccount") };
  const nav: NavItem[] = [
    { href: "/customer", label: t("customerNav.dashboard"), icon: "Home", exact: true },
    { href: "/customer/shop", label: t("customerNav.browse"), icon: "Store", group: g.shop },
    { href: "/customer/search", label: t("customerNav.search"), icon: "Search", group: g.shop },
    { href: "/customer/wishlist", label: t("customerNav.wishlist"), icon: "Heart", group: g.shop },
    { href: "/customer/cart", label: t("customerNav.cart"), icon: "ShoppingCart", group: g.shop },
    { href: "/customer/checkout", label: t("customerNav.checkout"), icon: "CreditCard", group: g.shop },
    { href: "/customer/orders", label: t("customerNav.orders"), icon: "Package", group: g.orders },
    { href: "/customer/tracking", label: t("customerNav.tracking"), icon: "Truck", group: g.orders },
    { href: "/customer/payments", label: t("customerNav.payments"), icon: "Wallet", group: g.orders },
    { href: "/customer/reviews", label: t("customerNav.reviews"), icon: "Star", group: g.orders },
    { href: "/customer/notifications", label: t("customerNav.notifications"), icon: "Bell", group: g.account },
    { href: "/customer/profile", label: t("customerNav.profile"), icon: "UserRound", group: g.account },
    { href: "/customer/settings", label: t("customerNav.settings"), icon: "Settings", group: g.account },
  ];
  return (
    <DashboardShell user={user} nav={nav} title={t("roles.CUSTOMER")}>
      {children}
    </DashboardShell>
  );
}
