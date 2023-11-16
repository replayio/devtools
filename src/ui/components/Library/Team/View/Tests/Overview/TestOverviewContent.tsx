import { useContext } from "react";

import { FailureRates } from "shared/test-suites/TestRun";
import { LibrarySpinner } from "ui/components/Library/LibrarySpinner";

import { useTest } from "../hooks/useTests";
import { TestContext } from "../TestContextRoot";
import { TestErrorList } from "./TestErrorList";
import styles from "../../../../Library.module.css";

export function TestOverviewContent() {
  const { filterByText, testId, tests } = useContext(TestContext);
  const hasFilters = filterByText !== "";
  const test = tests.find(test => test.testId === testId);

  let children = null;

  if (testId && test) {
    if (!hasFilters) {
      children = <TestOverview testId={testId} />;
    }
  } else {
    children = (
      <div className="flex h-full items-center justify-center p-2">
        <div className=" rounded-md bg-chrome py-2 px-3 text-center">
          Select a test to see its details here
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col text-sm transition ${styles.runOverview} `}>
      {children}
    </div>
  );
}

function TestOverview({ testId }: { testId: string }) {
  const { test, loading } = useTest(testId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-2">
        <LibrarySpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="flex flex-row items-center justify-between gap-1 border-b border-themeBorder py-2 px-4">
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
          {test.title}
        </div>
      </div>
      <div className="overflow-y-auto">
        <Stats failureRates={test.failureRates} />
        <TestErrorList errorFrequency={test.errorFrequency} executions={test.executions} />
      </div>
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
        <div className="flex overflow-x-auto">
          <div className="flex w-24 flex-shrink-0 flex-col">
            <div className="text-lg font-medium">{(hour * 100).toFixed(2)}%</div>
            <div className="uppercase">This Hour</div>
          </div>
          <div className="flex w-24 flex-shrink-0 flex-col">
            <div className="text-lg font-medium">{(day * 100).toFixed(2)}%</div>
            <div className="uppercase">Day</div>
          </div>
          <div className="flex w-24 flex-shrink-0 flex-col">
            <div className="text-lg font-medium">{(week * 100).toFixed(2)}%</div>
            <div className="uppercase">Week</div>
          </div>
          <div className="flex w-24 flex-shrink-0 flex-col">
            <div className="text-lg font-medium">{(month * 100).toFixed(2)}%</div>
            <div className="uppercase">Month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
