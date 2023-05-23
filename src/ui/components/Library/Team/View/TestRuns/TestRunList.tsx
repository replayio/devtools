import { useContext, useState } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { TestRunListItem } from "ui/components/Library/Team/View/TestRuns/TestRunListItem";
import { SecondaryButton } from "ui/components/shared/Button";

import { TestRunsContext } from "./TestRunsContextRoot";

const INITIAL_TEST_RUNS_DISPLAYED = 50;

export function TestRunList() {
  const { testRuns } = useContext(TestRunsContext);
  const [shouldShowAll, setShouldShowAll] = useState(false);

  if (!testRuns) {
    return (
      <div className="no-scrollbar m-4 flex flex-grow flex-col space-y-0 overflow-auto rounded-t-xl text-sm">
        <LibrarySpinner />
      </div>
    );
  }

  const overflow = testRuns.length > INITIAL_TEST_RUNS_DISPLAYED;
  const shownRuns =
    (shouldShowAll ? testRuns : testRuns?.slice(0, INITIAL_TEST_RUNS_DISPLAYED)) || [];

  return (
    <div className="no-scrollbar m-4 flex flex-grow flex-col space-y-0 overflow-auto rounded-t-xl text-sm">
      {shownRuns.map((t, i) => (
        <TestRunListItem key={i} testRun={t} onClick={() => ({})} />
      ))}
      {overflow && !shouldShowAll ? <ExpandButton showAll={() => setShouldShowAll(true)} /> : null}
    </div>
  );
}

export function ExpandButton({ showAll }: { showAll: () => void }) {
  return (
    <div className="flex justify-center p-4">
      <SecondaryButton className="" color="blue" onClick={showAll}>
        Show More
      </SecondaryButton>
    </div>
  );
}
