import { useContext } from "react";
import { TestRun } from "ui/hooks/tests";
import { TestRunListItem } from "./TestRunListItem";
import { TestRunsContext } from "./TestRunsViewer";

export function TestRunList({ testRuns }: { testRuns: TestRun[] }) {
  const { selectedRunIndex, setSelectedRunIndex } = useContext(TestRunsContext);

  return (
    <div className="flex flex-col space-y-0 overflow-y-auto text-sm shadow-md recording-list rounded-t-xl">
      {testRuns?.map((t, i) => (
        <TestRunListItem
          testRun={t}
          key={i}
          onClick={() => setSelectedRunIndex(i)}
          isSelected={selectedRunIndex === i}
        />
      ))}
    </div>
  );
}
