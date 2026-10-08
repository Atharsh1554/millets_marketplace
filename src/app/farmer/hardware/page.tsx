import Link from "next/link";
import { ListChecks, Wrench } from "lucide-react";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { HardwareCard } from "@/components/hardware/hardware-card";
import { requirePageRole } from "@/server/auth/guard";
import { listPublishedHardware } from "@/server/services/hardware";
import { getT } from "@/i18n/server";
import { HARDWARE_CATEGORIES } from "@/lib/labels";
import { cn } from "@/lib/format";

export default async function FeaturedHardwarePage({ searchParams }: PageProps<"/farmer/hardware">) {
  await requirePageRole(["FARMER"]);
  const t = await getT();
  const c = (await searchParams).category;
  const category = typeof c === "string" && (HARDWARE_CATEGORIES as readonly string[]).includes(c) ? c : undefined;
  const products = await listPublishedHardware(category);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={t("hardware.eyebrow")}
        title={t("hardware.title")}
        subtitle={t("hardware.subtitle")}
        action={
          <LinkButton href="/farmer/hardware/enquiries" variant="outline">
            <ListChecks className="size-4" /> {t("hardware.myEnquiries")}
          </LinkButton>
        }
      />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Chip href="/farmer/hardware" active={!category}>{t("common.actions.all")}</Chip>
        {HARDWARE_CATEGORIES.map((k) => (
          <Chip key={k} href={`/farmer/hardware?category=${k}`} active={category === k}>
            {t(`labels.hardwareCategory.${k}`)}
          </Chip>
        ))}
      </div>
      {products.length === 0 ? (
        <EmptyState icon={Wrench} title={t("hardware.empty")}>
          {t("hardware.emptyText")}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <HardwareCard key={p.id} p={p} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap", active ? "bg-leaf-700 text-white" : "bg-white text-earth-700 ring-1 ring-earth-100")}>
      {children}
    </Link>
  );
}
