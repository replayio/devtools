import { useContext } from "react";
import { TestRunListItem } from "ui/components/Library/Content/TestRuns/TestRunListItem";
import { TestRunsContext } from "./TestRunsPage";

export function TestRunList() {
  const { testRuns } = useContext(TestRunsContext);

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
