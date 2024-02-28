import { ReactNode } from "react";

import { ChartDataType } from "ui/components/Library/Team/View/TestRuns/TestRunListPanel/types";

export function getChartTooltip(chartData: ChartDataType): ReactNode {
  const { date, numRunsFailed, numRunsPassed, numTestsFailed, numTestsPassed } = chartData;

  const numRunsTotal = numRunsFailed + numRunsPassed;

  let testRunLabel = null;
  let testLabel = null;
  if (numRunsTotal === 0) {
    testRunLabel = "No tests were run on this day";
  } else {
    const numRunsTotal = numRunsFailed + numRunsPassed;

    if (numRunsFailed === 0) {
      testRunLabel = (
        <p>
          All <strong>{numRunsTotal.toLocaleString()}</strong> test runs passed
        </p>
      );
    } else if (numRunsPassed === 0) {
      testRunLabel = (
        <p>
          All <strong>{numRunsTotal.toLocaleString()}</strong> test runs contained at least one
          failing test
        </p>
      );
    } else {
      const percentage = numRunsTotal === 0 ? 0 : Math.round((numRunsFailed / numRunsTotal) * 100);

      testRunLabel = (
        <p>
          <strong>{percentage}%</strong> of <strong>{numRunsTotal.toLocaleString()}</strong> test
          runs contained at least one failing test
        </p>
      );
    }

    const numTestsTotal = numTestsFailed + numTestsPassed;
    if (numTestsTotal === 0) {
      // Redundant with no test runs
    } else if (numTestsFailed === 0) {
      testLabel = (
        <p>
          All <strong>{numTestsTotal.toLocaleString()}</strong> tests passed
        </p>
      );
    } else if (numTestsPassed === 0) {
      testLabel = (
        <p>
          All <strong>{numTestsTotal.toLocaleString()}</strong> tests failed
        </p>
      );
    } else {
      testLabel = (
        <p>
          <strong>{numTestsFailed.toLocaleString()}</strong> tests failed out of{" "}
          <strong>{numTestsTotal.toLocaleString()}</strong> total tests
        </p>
      );
    }
  }

  return (
    <>
      <h2>
        {date.toLocaleString("default", { month: "short" })} {date.getDate()}
      </h2>
      {testRunLabel}
      {testLabel}
    </>
  );
}
