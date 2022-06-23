import { useGetTeamRouteParams } from "../src/utils";
import { FilterBar } from "./FilterBar";
import Navigation from "./Navigation";
import { RecordingsPage } from "./RecordingsPage";
import { TestResultsPage } from "./TestResultsPage";
import { TestRunsPage } from "./TestRunsPage";
import { ViewSwitcher } from "./ViewSwitcher";

export const TEAMS = [
  { name: "glide", isTest: false },
  { name: "dynaboard", isTest: true },
  { name: "hasura", isTest: false },
];

export default function Library() {
  return (
    <div className="flex flex-row w-screen h-screen">
      <Navigation />
      <div className="flex flex-col flex-grow overflow-hidden">
        <FilterBar />
        <ViewSwitcher />
        <LibraryContent />
      </div>
    </div>
  );
}

function LibraryContent() {
  const { view } = useGetTeamRouteParams();
  return (
    <div className="flex flex-row flex-grow overflow-hidden">
      {view === "recordings" ? (
        <RecordingsPage />
      ) : view === "runs" ? (
        <TestRunsPage />
      ) : (
        <TestResultsPage />
      )}
    </div>
  );
}
