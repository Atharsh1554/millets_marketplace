import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { HarvestForm } from "@/components/farmer/harvest-form";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Submit your harvest" };

export default async function SubmitHarvestPage() {
  const user = await requirePageRole(["FARMER"]);
  const [farmer, t] = await Promise.all([db.farmer.findUniqueOrThrow({ where: { userId: user.id } }), getT()]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t("farmer.submitEyebrow")} title={t("farmer.submitHarvest")} subtitle={t("farmer.submitSubtitle")} />
      <HarvestForm
        defaults={{
          contactName: user.name,
          contactPhone: user.phone ?? "",
          contactEmail: user.email,
          village: farmer.village,
          district: farmer.district,
          state: farmer.state,
          farmLocation: farmer.farmLocation ?? "",
        }}
      />
    </div>
  );
}
