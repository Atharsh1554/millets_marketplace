import { Sprout } from "lucide-react";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { SubmissionsTable } from "@/components/farmer/submissions-table";
import { requirePageRole } from "@/server/auth/guard";
import { farmerSubmissions } from "@/server/services/harvest";
import { getT } from "@/i18n/server";

export default async function MyHarvestsPage() {
  const user = await requirePageRole(["FARMER"]);
  const [subs, t] = await Promise.all([farmerSubmissions(user.farmer!.id), getT()]);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("farmer.mySubmissions")} action={<LinkButton href="/farmer/submit">{t("farmer.submitHarvest")}</LinkButton>} />
      {subs.length === 0 ? <EmptyState icon={Sprout} title={t("farmer.noHarvests")} /> : <SubmissionsTable rows={subs} />}
    </div>
  );
}
