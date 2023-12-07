import { useContext } from "react";

import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";

import { FilterBarContainer } from "./FilterBarContainer";
import { TestRunsPage as NewTestRunsPage } from "./NewTestRuns/TestRunsPage";
import { RecordingsPage } from "./Recordings/RecordingsPage";
import { TestRunsPage } from "./TestRuns/TestRunsPage";
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
  const [enableTestSuitesNewRunsView] = useLocalStorageUserData("enableTestSuitesNewRunsView");
  return (
    <div className="flex flex-grow flex-col overflow-hidden">
      <FilterBarContainer />
      <div className="flex flex-grow flex-row overflow-hidden">
        {view === "recordings" ? (
          <RecordingsPage />
        ) : view === "runs" ? (
          enableTestSuitesNewRunsView ? (
            <NewTestRunsPage />
          ) : (
            <TestRunsPage />
          )
        ) : view === "tests" ? (
          <TestsPage />
        ) : null}
      </div>
    </div>
  );
}
