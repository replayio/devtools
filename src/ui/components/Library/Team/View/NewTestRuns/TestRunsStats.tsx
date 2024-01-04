import { useContext } from "react";

import { Chart } from "./Chart";
import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunsStats() {
  const { testRuns } = useContext(TestRunsContext);

  const buildsCount = testRuns.length;
  const buildFailuresCount = testRuns.filter(r => r.results.counts.failed > 0).length;
  const buildFailureRate = buildFailuresCount / buildsCount;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-col overflow-auto rounded-lg bg-chrome p-4">
        <Chart />
        <div className="px-16">
          Weekly average failure rate: {buildFailureRate * 100}% ({buildFailuresCount}/{buildsCount}
          )
        </div>
      </div>
    </div>
  );
}
