import { useContext } from "react";

import { FailureRates } from "shared/test-suites/TestRun";

import { TestContext } from "../TestContextRoot";
import { TestErrorList } from "./ErrorFrequency";
import styles from "../../../../Library.module.css";

export function TestOverviewContent() {
  const { filterByText, testId, tests } = useContext(TestContext);
  const hasFilters = filterByText !== "";
  const test = tests.find(test => test.testId === testId);

  let children = null;

  if (test) {
    if (!hasFilters || tests.find(test => test.testId === testId)) {
      children = (
        <div className="flex flex-col" data-test-id="TestRunSummary">
          <div className="flex flex-row items-center justify-between gap-1 border-b border-themeBorder py-2 px-4">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              {test.title}
            </div>
          </div>
          <Stats failureRates={test.failureRates} />
          <TestErrorList errorFrequency={test.errorFrequency} executions={test.executions} />
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
    <div className="border-b border-themeBorder py-2 px-4">
      <div>
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
          Historical failure rate
        </div>
        <div className="flex">
          <div className="flex w-24 flex-col">
            <div className="text-lg font-medium">{(hour * 100).toFixed(2)}%</div>
            <div className="uppercase">This Hour</div>
          </div>
          <div className="flex w-24 flex-col">
            <div className="text-lg font-medium">{(day * 100).toFixed(2)}%</div>
            <div className="uppercase">Day</div>
          </div>
          <div className="flex w-24 flex-col">
            <div className="text-lg font-medium">{(week * 100).toFixed(2)}%</div>
            <div className="uppercase">Week</div>
          </div>
          <div className="flex w-24 flex-col">
            <div className="text-lg font-medium">{(month * 100).toFixed(2)}%</div>
            <div className="uppercase">Month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
