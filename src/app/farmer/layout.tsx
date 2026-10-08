import { DashboardShell } from "@/components/dashboard-shell";
import type { NavItem } from "@/components/side-nav";
import { requirePageRole } from "@/server/auth/guard";
import { getT } from "@/i18n/server";

export default async function FarmerLayout({ children }: LayoutProps<"/farmer">) {
  const user = await requirePageRole(["FARMER"], "/farmer");
  const t = await getT();
  const g = { products: t("farmerNav.groupProducts"), hardware: t("farmerNav.groupHardware"), sales: t("farmerNav.groupSales"), account: t("farmerNav.groupAccount") };
  const nav: NavItem[] = [
    { href: "/farmer", label: t("farmerNav.dashboard"), icon: "Home", exact: true },
    { href: "/farmer/farm", label: t("farmerNav.farmProfile"), icon: "Tractor" },
    { href: "/farmer/products", label: t("farmerNav.products"), icon: "Store", group: g.products },
    { href: "/farmer/submit", label: t("farmerNav.addProduct"), icon: "PackagePlus", group: g.products },
    { href: "/farmer/inventory", label: t("farmerNav.inventory"), icon: "Warehouse", group: g.products },
    { href: "/farmer/batches", label: t("farmerNav.batches"), icon: "Layers", group: g.products },
    { href: "/farmer/harvests", label: t("farmerNav.harvests"), icon: "Sprout", group: g.products },
    { href: "/farmer/hardware", label: t("farmerNav.hardware"), icon: "Wrench", group: g.hardware },
    { href: "/farmer/hardware/enquiries", label: t("farmerNav.enquiries"), icon: "MessageSquare", group: g.hardware },
    { href: "/farmer/orders", label: t("farmerNav.orders"), icon: "ShoppingCart", group: g.sales },
    { href: "/farmer/order-processing", label: t("farmerNav.orderProcessing"), icon: "Truck", group: g.sales },
    { href: "/farmer/sales", label: t("farmerNav.sales"), icon: "TrendingUp", group: g.sales },
    { href: "/farmer/payments", label: t("farmerNav.earnings"), icon: "Wallet", group: g.sales },
    { href: "/farmer/notifications", label: t("farmerNav.notifications"), icon: "Bell", group: g.account },
    { href: "/farmer/profile", label: t("farmerNav.profile"), icon: "UserRound", group: g.account },
    { href: "/farmer/settings", label: t("farmerNav.settings"), icon: "Settings", group: g.account },
  ];
  return (
    <DashboardShell user={user} nav={nav} title={t("roles.FARMER")}>
      {children}
    </DashboardShell>
  );
}
