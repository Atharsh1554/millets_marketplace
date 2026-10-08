import { FilteredTests } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function Page() {
  await requirePageRole(["QUALITY_TEAM"]);
  return <FilteredTests statuses={["TESTING"]} basePath="/quality" title="Request Reinspection" subtitle="Send an inspection back for additional physical testing, with a reason." empty="No inspections awaiting a decision" actionLabel="Request reinspection" linkSuffix="?decision=ADDITIONAL_TESTING_REQUIRED#result" />;
}
