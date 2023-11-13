import orderBy from "lodash/orderBy";
import { useContext, useState } from "react";

import { FailureRates, __EXECUTION } from "shared/test-suites/TestRun";

import { TestContext } from "../TestContextRoot";
import { Status } from "../TestListItem";
import styles from "../../../../Library.module.css";

export function TestOverviewContent() {
  const { filterByText, testId, tests } = useContext(TestContext);
  const hasFilters = filterByText !== "";
  const test = tests.find(test => test.testId === testId);

  let children = null;

  if (test) {
    if (!hasFilters || tests.find(test => test.testId === testId)) {
      children = (
        <div
          className="flex flex-col gap-1 border-b border-themeBorder"
          data-test-id="TestRunSummary"
        >
          <div className="flex flex-row items-center justify-between gap-1 border-b border-themeBorder py-2 px-4">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              {test.title}
            </div>
          </div>
          <Stats failureRates={test.failureRates} />
          <ErrorFrequency errorFrequency={test.errorFrequency} executions={test.executions} />
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

function ErrorFrequency({
  errorFrequency,
  executions,
}: {
  errorFrequency: Record<string, number>;
  executions: __EXECUTION[];
}) {
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const passing = executions.filter(e => e.result === "passed");
  const failing = executions.filter(e => e.result === "failed");
  const sortedFailing = orderBy(failing, "createdAt", "desc");
  const sortedPassing = orderBy(passing, "createdAt", "desc");

  // ${isSelected ? styles.libraryRowSelected : ""}

  return (
    <div>
      <div className="border-b border-themeBorder py-2 px-4">
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
          Top Errors
        </div>
        <div>
          {Object.entries(errorFrequency)
            .slice(0, 5)
            .map(([msg, count]) => (
              <div
                key={msg}
                className={`flex cursor-pointer flex-row items-center space-x-3 rounded-sm border-b border-chrome bg-themeBase-100 p-3 ${styles.libraryRow}
            `}
                onClick={() => setSelectedError(msg)}
              >
                <div className="flex h-5 w-8 shrink-0 items-center justify-center rounded-md bg-[#F02D5E] text-xs font-bold text-chrome">
                  {count}
                </div>
                <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{msg}</div>
              </div>
            ))}
        </div>
      </div>
      {selectedError ? (
        <div className="flex flex-col gap-2 border-b border-themeBorder py-2 px-4">
          {/* <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
            Selected error: {selectedError}
          </div> */}
          <div className="flex flex-col gap-1">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              Replay that contain this error
            </div>
            <div>
              {sortedFailing.slice(0, 3).map((e, i) => (
                <div key={i}>{e.createdAt}</div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-medium">
              Recent replays of the test passing
            </div>
            <div>
              {sortedPassing.slice(0, 3).map((e, i) => (
                <div key={i}>{e.createdAt}</div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
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
