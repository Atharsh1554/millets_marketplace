import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardCheck, FlaskConical, Hourglass, IndianRupee, Package, Scale, Sprout, Wallet, Wrench } from "lucide-react";
import { Card, CardHeader, EmptyState, LinkButton, Notice, PageHeader, StatCard } from "@/components/ui";
import { Timeline } from "@/components/timeline";
import { SubmissionsTable } from "@/components/farmer/submissions-table";
import { HardwareCard } from "@/components/hardware/hardware-card";
import { requirePageRole } from "@/server/auth/guard";
import { farmerSubmissions } from "@/server/services/harvest";
import { farmerStats } from "@/server/services/finance";
import { featuredHardware } from "@/server/services/hardware";
import { getT } from "@/i18n/server";
import { harvestTimeline } from "@/lib/harvest-timeline";
import { formatINR, formatKg } from "@/lib/format";

export default async function FarmerDashboard({ searchParams }: PageProps<"/farmer">) {
  const user = await requirePageRole(["FARMER"]);
  const farmerId = user.farmer!.id;
  const [stats, subs, hardware, t] = await Promise.all([farmerStats(farmerId), farmerSubmissions(farmerId), featuredHardware(3), getT()]);
  const welcome = (await searchParams).welcome === "1";
  const active = subs.find((s) => !["DRAFT", "ADMIN_REJECTED", "PHYSICAL_TEST_FAILED", "SOLD_OUT"].includes(s.status));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={t("farmer.dashboardEyebrow")}
        title={t("farmer.greeting", { name: user.name.split(" ")[0] })}
        subtitle={t("farmer.dashboardSubtitle")}
        action={
          <LinkButton href="/farmer/submit">
            <Sprout className="size-4" /> {t("farmer.submitHarvest")}
          </LinkButton>
        }
      />
      {welcome && (
        <div className="mb-6">
          <Notice tone="success" title={t("farmer.welcomeTitle")}>
            {t("farmer.welcomeText")}
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t("farmer.statSubmitted")} value={stats.submitted} icon={ClipboardCheck} />
        <StatCard label={t("farmer.statApproved")} value={stats.adminApproved} icon={BadgeCheck} tone="sky" />
        <StatCard label={t("farmer.statPassed")} value={stats.testsPassed} icon={FlaskConical} tone="leaf" />
        <StatCard label={t("farmer.statProcured")} value={stats.procured} icon={Package} tone="earth" />
        <StatCard label={t("farmer.statQuantity")} value={formatKg(stats.procuredGrams)} icon={Scale} tone="earth" />
        <StatCard label={t("farmer.statEarnings")} value={formatINR(stats.totalEarnings)} icon={IndianRupee} tone="gold" />
        <StatCard label={t("farmer.statPending")} value={formatINR(stats.pendingPayments)} icon={Hourglass} tone="gold" />
        <StatCard label={t("farmer.statCompleted")} value={formatINR(stats.completedPayments)} icon={Wallet} tone="leaf" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <h2 className="mb-3 font-display text-xl font-semibold text-earth-900">{t("farmer.mySubmissions")}</h2>
          {subs.length === 0 ? (
            <EmptyState icon={Sprout} title={t("farmer.noHarvests")} action={<LinkButton href="/farmer/submit">{t("farmer.submitFirst")}</LinkButton>}>
              {t("farmer.noHarvestsText")}
            </EmptyState>
          ) : (
            <SubmissionsTable rows={subs} />
          )}
        </div>
        {active && (
          <Card className="h-fit">
            <CardHeader
              title={<Link href={`/farmer/harvests/${active.id}`} className="hover:underline">{active.title}</Link>}
              subtitle={`${formatKg(active.quantityGrams)} · ${active.code}`}
            />
            <div className="p-5">
              <Timeline compact steps={harvestTimeline({ status: active.status, infoRequested: active.infoRequested, procurement: active.procurement }, t)} />
            </div>
          </Card>
        )}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-earth-900">
              <Wrench className="size-5 text-leaf-700" /> {t("hardware.dashboardTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{t("hardware.dashboardSubtitle")}</p>
          </div>
          <Link href="/farmer/hardware" className="inline-flex items-center gap-1 text-sm font-semibold text-leaf-700 hover:underline">
            {t("hardware.viewAll")} <ArrowRight className="size-4" />
          </Link>
        </div>
        {hardware.length === 0 ? (
          <EmptyState icon={Wrench} title={t("hardware.empty")}>
            {t("hardware.emptyText")}
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hardware.map((p) => (
              <HardwareCard key={p.id} p={p} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
