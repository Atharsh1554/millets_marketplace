import { DashboardShell } from "@/components/dashboard-shell";
import type { NavItem } from "@/components/side-nav";
import { requirePageRole } from "@/server/auth/guard";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "Home", exact: true },
  { href: "/admin/customers", label: "Customers", icon: "Users", group: "People" },
  { href: "/admin/farmers", label: "Farmers", icon: "Tractor", group: "People" },
  { href: "/admin/quality-team", label: "Quality Team", icon: "UserCog", group: "People" },
  { href: "/admin/farmer-verification", label: "Farmer Verification", icon: "UserCheck", group: "People" },
  { href: "/admin/products", label: "Products", icon: "Store", group: "Catalog" },
  { href: "/admin/categories", label: "Categories", icon: "Tags", group: "Catalog" },
  { href: "/admin/batches", label: "Batches", icon: "Layers", group: "Catalog" },
  { href: "/admin/orders", label: "Orders", icon: "ShoppingCart", group: "Catalog" },
  { href: "/admin/submissions", label: "Harvest Submissions", icon: "ClipboardList", group: "Operations" },
  { href: "/admin/quality", label: "Quality Management", icon: "FlaskConical", group: "Operations" },
  { href: "/admin/checklist", label: "Testing Checklist", icon: "ListChecks", group: "Operations" },
  { href: "/admin/procurement", label: "Procurement", icon: "Truck", group: "Operations" },
  { href: "/admin/inventory", label: "Inventory", icon: "Warehouse", group: "Operations" },
  { href: "/admin/hardware", label: "Hardware Products", icon: "Wrench", group: "Hardware" },
  { href: "/admin/hardware/enquiries", label: "Hardware Enquiries", icon: "MessageSquare", group: "Hardware" },
  { href: "/admin/payments", label: "Payments", icon: "Wallet", group: "Finance" },
  { href: "/admin/complaints", label: "Complaints", icon: "MessageSquareWarning", group: "Finance" },
  { href: "/admin/reports", label: "Reports", icon: "FileText", group: "Finance" },
  { href: "/admin/finance", label: "Analytics", icon: "BarChart3", group: "Finance" },
  { href: "/admin/notifications", label: "Notifications", icon: "Bell", group: "System" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "ScrollText", group: "System" },
  { href: "/admin/settings", label: "Settings", icon: "Settings", group: "System" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePageRole(["ADMIN"], "/admin");
  return (
    <DashboardShell user={user} nav={NAV} title="Admin">
      {children}
    </DashboardShell>
  );
}
