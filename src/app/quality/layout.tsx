import { DashboardShell } from "@/components/dashboard-shell";
import type { NavItem } from "@/components/side-nav";
import { requirePageRole } from "@/server/auth/guard";

const NAV: NavItem[] = [
  { href: "/quality", label: "Dashboard", icon: "Home", exact: true },
  { href: "/quality/pending", label: "Pending Inspections", icon: "ClipboardList", group: "Inspections" },
  { href: "/quality/verification", label: "Product Verification", icon: "Microscope", group: "Inspections" },
  { href: "/quality/batches", label: "Batch Inspection", icon: "Layers", group: "Inspections" },
  { href: "/quality/parameters", label: "Quality Parameters", icon: "SlidersHorizontal", group: "Inspections" },
  { href: "/quality/tests", label: "Inspection Details", icon: "FlaskConical", group: "Inspections" },
  { href: "/quality/approve", label: "Approve Product", icon: "CircleCheck", group: "Decisions" },
  { href: "/quality/reject", label: "Reject Product", icon: "CircleX", group: "Decisions" },
  { href: "/quality/reinspection", label: "Request Reinspection", icon: "RotateCcw", group: "Decisions" },
  { href: "/quality/reports", label: "Upload Test Reports", icon: "FileUp", group: "Decisions" },
  { href: "/quality/history", label: "Quality History", icon: "History", group: "Records" },
  { href: "/quality/verified", label: "Verified Products", icon: "BadgeCheck", group: "Records" },
  { href: "/quality/rejected", label: "Rejected Products", icon: "CircleX", group: "Records" },
  { href: "/quality/notifications", label: "Notifications", icon: "Bell", group: "Account" },
  { href: "/quality/profile", label: "Profile", icon: "UserRound", group: "Account" },
  { href: "/quality/settings", label: "Settings", icon: "Settings", group: "Account" },
];

export default async function QualityLayout({ children }: LayoutProps<"/quality">) {
  // Quality-team-only area. Admins manage quality from /admin/quality using the same views.
  const user = await requirePageRole(["QUALITY_TEAM"], "/quality");
  return (
    <DashboardShell user={user} nav={NAV} title="Quality Team">
      {children}
    </DashboardShell>
  );
}
