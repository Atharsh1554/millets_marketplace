import { FilteredTests } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function Page() {
  await requirePageRole(["QUALITY_TEAM"]);
  return <FilteredTests statuses={["TESTING"]} basePath="/quality" title="Reject Product" subtitle="Inspections ready for a decision. Rejecting requires a reason, which is shared with the farmer." empty="No inspections awaiting a decision" actionLabel="Reject" linkSuffix="?decision=FAILED#result" />;
}
