import { useContext } from "react";

import { FilterBarContainer } from "./FilterBarContainer";
import { TestRunsPage as NewTestRunsPage } from "./NewTestRuns/TestRunsPage";
import { RecordingsPage } from "./Recordings/RecordingsPage";
import { TestsPage } from "./Tests/TestsPage";
import { ViewContext, ViewContextRoot } from "./ViewContextRoot";

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
    <div className="flex flex-grow flex-col overflow-hidden">
      <FilterBarContainer />
      <div className="flex flex-grow flex-row overflow-hidden">
        {view === "recordings" ? (
          <RecordingsPage />
        ) : view === "runs" ? (
          <NewTestRunsPage />
        ) : view === "tests" ? (
          <TestsPage />
        ) : null}
      </div>
    </div>
  );
}
