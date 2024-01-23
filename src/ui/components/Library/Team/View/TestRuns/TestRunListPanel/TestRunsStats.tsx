import { useContext } from "react";

import { TestRunsContext } from "../TestRunsContextRoot";
import { Chart } from "./Chart";
import styles from "./TestRunsStats.module.css";

export function TestRunsStats() {
  const { testRuns } = useContext(TestRunsContext);

  const buildsCount = testRuns.length;
  const buildFailuresCount = testRuns.filter(r => r.results.counts.failed > 0).length;
  const buildFailureRate = buildFailuresCount / buildsCount;

  if (!testRuns.length) {
    return null;
  }

  return (
    <div className={styles.testRunsStatsContainer}>
      <div className={styles.chartContainer}>
        <Chart />
        <div
          className={styles.failureRateDescription}
          title={`${buildFailuresCount}/${buildsCount}`}
        >
          <b>Failure rate:</b> {(buildFailureRate * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
