import { useContext } from "react";
import { TestRunListItem } from "ui/components/Library/Team/View/TestRuns/TestRunListItem";
import { TestRunsContext } from "./TestRunsContext";

export function TestRunList() {
  const { testRuns } = useContext(TestRunsContext);

  // TODO: Add a proper loading state indicator here -jaril.
  return (
    <div className="flex flex-col flex-grow m-4 space-y-2 overflow-auto">
      {testRuns ? (
        testRuns.map((t, i) => <TestRunListItem key={i} testRun={t} onClick={() => ({})} />)
      ) : (
        <div>Loading Placeholder</div>
      )}
    </div>
  );
}
