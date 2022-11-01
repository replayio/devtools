import { useContext } from "react";

import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { TestRunListItem } from "ui/components/Library/Team/View/TestRuns/TestRunListItem";

import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunList() {
  const { testRuns } = useContext(TestRunsContext);

  return (
    <div className="no-scrollbar m-4 flex flex-grow flex-col space-y-0 overflow-auto rounded-t-xl text-sm">
      {testRuns ? (
        testRuns.map((t, i) => <TestRunListItem key={i} testRun={t} onClick={() => ({})} />)
      ) : (
        <LibrarySpinner />
      )}
    </div>
  );
}
