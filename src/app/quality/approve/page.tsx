import { FilteredTests } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function Page() {
  await requirePageRole(["QUALITY_TEAM"]);
  return <FilteredTests statuses={["TESTING"]} basePath="/quality" title="Approve Product" subtitle="Inspections ready for a decision. Approving requires every checklist item marked Pass." empty="No inspections awaiting a decision" actionLabel="Approve" linkSuffix="?decision=PASSED#result" />;
}
