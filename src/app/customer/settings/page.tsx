import { MapPin } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import { SettingsView } from "@/components/account/account-views";
import { AddressBook } from "@/components/account/account-forms";
import { requirePageRole } from "@/server/auth/guard";
import { db } from "@/server/db";
import { getT } from "@/i18n/server";

export default async function CustomerSettingsPage() {
  const user = await requirePageRole(["CUSTOMER"]);
  const t = await getT();
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return (
    <SettingsView>
      <Card>
        <CardHeader title={t("account.deliveryAddresses")} icon={MapPin} />
        <div className="p-5">
          <AddressBook addresses={addresses.map((a) => ({ id: a.id, isDefault: a.isDefault, label: `${a.fullName}, ${a.line1}${a.line2 ? ", " + a.line2 : ""}, ${a.city}, ${a.state} ${a.pincode} · ${a.phone}` }))} />
        </div>
      </Card>
    </SettingsView>
  );
}
