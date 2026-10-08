import { OutcomesView } from "@/components/quality/outcomes-table";
import { requirePageRole } from "@/server/auth/guard";

export default async function Page() {
  await requirePageRole(["QUALITY_TEAM"]);
  return <OutcomesView status="PASSED" basePath="/quality" />;
}
