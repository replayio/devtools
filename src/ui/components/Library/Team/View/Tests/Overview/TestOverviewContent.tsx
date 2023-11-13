import { useContext } from "react";

import { FailureRates } from "shared/test-suites/TestRun";
import { useTestRunDetailsSuspends } from "ui/components/Library/Team/View/TestRuns/hooks/useTestRunDetailsSuspends";
import { RunResults } from "ui/components/Library/Team/View/TestRuns/Overview/RunResults";

import { TestContext } from "../TestContextRoot";
import { RunSummary } from "./TestSummary";
import styles from "../../../../Library.module.css";

export function TestOverviewContent() {
  // const { filterByStatus, filterByText, testRunId, testRunIdForDisplay, testRuns } =
  const { filterByText, testId, testIdForDisplay, tests } = useContext(TestContext);

  // const { recordings, durationMs } = useTestRunDetailsSuspends(testRunId);

  const isPending = false; // testRunId !== testRunIdForDisplay;

  // const hasFilters = filterByStatus !== "all" || filterByText !== "";
  const hasFilters = filterByText !== "";
  const test = tests.find(test => test.testId === testId);

  let children = null;
  // if (testRun && recordings) {

  if (test) {
    if (!hasFilters || tests.find(test => test.testId === testId)) {
      children = (
        <div
          className={`flex flex-col gap-1 border-b border-themeBorder py-2  px-4 ${
            isPending ? "opacity-50" : ""
          }`}
          data-test-id="TestRunSummary"
        >
          <div className="flex flex-row items-center justify-between gap-1">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              {test.title}
            </div>
          </div>

          {/* <div>{test.title}</div> */}
          {/* <Stats failureRates={test.failureRates} /> */}
          {/* <RunSummary
            isPending={isPending}
            recordings={recordings}
            testRun={testRun}
            durationMs={durationMs}
          /> */}
          {/* <RunResults isPending={isPending} /> */}
        </div>
      );
    }
  }

  return (
    <div className={`flex h-full flex-col text-sm transition ${styles.runOverview} `}>
      {children}
    </div>
  );
}

function Stats({ failureRates }: { failureRates: FailureRates }) {
  const { hour, day, week, month } = failureRates;

  return (
    <div>
      <div>
        <div>Historical failure rate</div>
        <div className="flex">
          <div className="flex w-24 flex-col">
            <div>{hour.toFixed(2)}%</div>
            <div>This Hour</div>
          </div>
          <div className="flex w-24 flex-col">
            <div>{day.toFixed(2)}%</div>
            <div>Day</div>
          </div>
          <div className="flex w-24 flex-col">
            <div>{week.toFixed(2)}%</div>
            <div>Week</div>
          </div>
          <div className="flex w-24 flex-col">
            <div>{month.toFixed(2)}%</div>
            <div>Month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
