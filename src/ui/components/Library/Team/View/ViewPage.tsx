import { useContext } from "react";
import { FilterBarContainer } from "./FilterBarContainer";
import { RecordingsPage } from "./Recordings/RecordingsPage";
import { TestResultsPage } from "./TestResults/TestResultsPage";
import { TestRunsPage } from "./TestRuns/TestRunsPage";
import { ViewSwitcher } from "./ViewSwitcher";
import { ViewContextRoot, ViewContext } from "./ViewContext";

export function ViewPage({ defaultView }: { defaultView: string }) {
  return (
    <ViewContextRoot defaultView={defaultView}>
      <ViewPageContent />
    </ViewContextRoot>
  );
}

export function ViewPageContent() {
  const { view } = useContext(ViewContext);

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <ViewSwitcher />
      <FilterBarContainer />
      <div className="flex flex-row flex-grow overflow-hidden">
        {view === "recordings" ? (
          <RecordingsPage />
        ) : view === "runs" ? (
          <TestRunsPage />
        ) : (
          <TestResultsPage />
        )}
      </div>
    </div>
  );
}
