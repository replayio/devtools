import { useContext } from "react";

import { trackEvent } from "ui/utils/telemetry";

import { FilterBarContainer } from "./FilterBarContainer";
import { TestRunsPage } from "./NewTestRuns/TestRunsPage";
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
          <TestRunsPage />
        ) : view === "tests" ? (
          <TestsPage />
        ) : null}
      </div>
    </div>
  );
}
