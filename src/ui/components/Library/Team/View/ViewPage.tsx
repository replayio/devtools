import { useContext } from "react";

import { useLaunchDarkly } from "ui/utils/launchdarkly";

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

function TestRunsView() {
  const { getFeatureFlag, ready } = useLaunchDarkly();
  const enableTestSuitesNewRunsView = getFeatureFlag("enable-new-test-run-view");

  if (!ready) {
    return null;
  }

  return enableTestSuitesNewRunsView ? <NewTestRunsPage /> : <TestRunsPage />;
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
          <TestRunsView />
        ) : view === "tests" ? (
          <TestsPage />
        ) : null}
      </div>
    </div>
  );
}
