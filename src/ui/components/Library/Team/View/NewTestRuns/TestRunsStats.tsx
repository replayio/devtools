import { useContext } from "react";

import { Chart } from "./Chart";
import { TestRunsContext } from "./TestRunsContextRoot";
import styles from "./TestRunsStats.module.css";

export function TestRunsStats() {
  const { testRuns } = useContext(TestRunsContext);

  const buildsCount = testRuns.length;
  const buildFailuresCount = testRuns.filter(r => r.results.counts.failed > 0).length;
  const buildFailureRate = buildFailuresCount / buildsCount;

  const testFailuresCount = testRuns.reduce((acc, r) => acc + r.results.counts.failed, 0);
  const testsCount = testRuns.reduce(
    (acc, r) => acc + r.results.counts.passed + r.results.counts.flaky,
    0
  );
  const testFailureRate = testFailuresCount / testsCount;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Chart />
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-1 rounded-lg bg-chrome p-4">
          <div className="font-bold">Build failure rate</div>
          <div className="flex flex-row gap-1">
            <div className={styles.failureRate}>{(buildFailureRate * 100).toFixed(0)}%</div>
            <div>
              ({buildFailuresCount}/{buildsCount})
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-1 rounded-lg bg-chrome p-4">
            <div className="font-bold">Test failure rate</div>
            <div className="flex flex-row gap-1">
              <div className={styles.failureRate}>{(testFailureRate * 100).toFixed(0)}%</div>
              <div>
                ({testFailuresCount}/{testsCount})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
