import { useContext } from "react";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";
import { TestRunListItem } from "ui/components/Library/Team/View/TestRuns/TestRunListItem";
import { TestRunsContext } from "./TestRunsContext";

export function TestRunList() {
  const { testRuns } = useContext(TestRunsContext);

  return (
    <div className="flex flex-col flex-grow m-4 space-y-2 overflow-auto text-sm">
      {testRuns ? (
        testRuns.map((t, i) => <TestRunListItem key={i} testRun={t} onClick={() => ({})} />)
      ) : (
        <LibrarySpinner />
      )}
    </div>
  );
}
