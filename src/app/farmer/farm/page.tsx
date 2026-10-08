import { BadgeCheck, Tractor } from "lucide-react";
import { Badge, Card, CardHeader, DetailList, Notice, PageHeader } from "@/components/ui";
import { FarmProfileForm } from "@/components/account/account-forms";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { getT } from "@/i18n/server";
import { formatDate, formatKg } from "@/lib/format";

const TONE = { PENDING: "warning", VERIFIED: "success", REJECTED: "danger" } as const;

export default async function FarmProfilePage() {
  const user = await requirePageRole(["FARMER"]);
  const [farmer, t] = await Promise.all([
    db.farmer.findUniqueOrThrow({
      where: { userId: user.id },
      include: { submissions: { select: { status: true } }, procurements: { select: { actualQuantityGrams: true } } },
    }),
    getT(),
  ]);
  const label = t(`labels.verificationStatus.${farmer.verificationStatus}`);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("farmer.farmTitle")} subtitle={t("farmer.farmSubtitle")} action={<Badge tone={TONE[farmer.verificationStatus]} className="px-3 py-1 text-sm">{label}</Badge>} />
      {farmer.verificationStatus !== "VERIFIED" && (
        <Notice tone={farmer.verificationStatus === "REJECTED" ? "danger" : "gold"} icon={BadgeCheck} title={label}>
          {farmer.verificationNote ?? t("farmer.verificationNote")}
        </Notice>
      )}
      <Card>
        <CardHeader title={t("farmer.farmDetails")} icon={Tractor} />
        <div className="p-5">
          <FarmProfileForm village={farmer.village} district={farmer.district} state={farmer.state} farmLocation={farmer.farmLocation ?? ""} upiId={farmer.upiId ?? ""} />
        </div>
      </Card>
      <Card>
        <CardHeader title={t("farmer.summary")} />
        <div className="p-5">
          <DetailList
            cols={3}
            items={[
              [t("farmer.memberSince"), formatDate(farmer.createdAt)],
              [t("farmer.statSubmitted"), farmer.submissions.filter((s) => s.status !== "DRAFT").length],
              [t("farmer.statQuantity"), formatKg(farmer.procurements.reduce((a, p) => a + (p.actualQuantityGrams ?? 0), 0))],
              [t("farmer.verifiedOn"), formatDate(farmer.verifiedAt)],
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
