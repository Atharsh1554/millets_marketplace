import { FilteredTests } from "@/components/quality/tests-list-view";
import { requirePageRole } from "@/server/auth/guard";

export default async function Page() {
  await requirePageRole(["QUALITY_TEAM"]);
  return <FilteredTests statuses={["TESTING", "ADDITIONAL_TESTING_REQUIRED"]} basePath="/quality" title="Product Verification" subtitle="Samples currently being physically verified against the quality checklist." empty="Nothing in verification" actionLabel="Enter Results" />;
}
