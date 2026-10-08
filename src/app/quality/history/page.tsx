import { FilteredTests } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function Page() {
  await requirePageRole(["QUALITY_TEAM"]);
  return <FilteredTests statuses={["PASSED", "FAILED"]} basePath="/quality" title="Quality History" subtitle="Completed physical inspections and their outcomes." empty="No completed inspections yet" actionLabel="View" />;
}
