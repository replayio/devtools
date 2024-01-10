import { useContext } from "react";

import { Chart } from "./Chart";
import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunsStats() {
  const { testRuns } = useContext(TestRunsContext);

  const buildsCount = testRuns.length;
  const buildFailuresCount = testRuns.filter(r => r.results.counts.failed > 0).length;
  const buildFailureRate = buildFailuresCount / buildsCount;

  if (!testRuns.length) {
    return null;
  }

  return (
    <div className="test-runs-stats-container">
      <div className="chart-container">
        <Chart />
        <div className="failure-rate-description" title={`${buildFailuresCount}/${buildsCount}`}>
          <b>Failure rate:</b> {(buildFailureRate * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
