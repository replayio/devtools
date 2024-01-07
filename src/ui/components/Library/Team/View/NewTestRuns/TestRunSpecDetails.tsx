import { useContext, useMemo, useState } from "react";

import Icon from "replay-next/components/Icon";
import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";

import { useTestRunDetailsSuspends } from "../TestRuns/hooks/useTestRunDetailsSuspends";
import { TestSuitePanelMessage } from "../TestSuitePanelMessage";
import { TestRunPanelWrapper } from "./TestRunPanelWrapper";
import { TestRunResultList } from "./TestRunResultList";
import { TestRunsContext } from "./TestRunsContextRoot";

export function TestRunSpecDetails() {
  const { spec, filterTestsByText } = useContext(TestRunsContext);
  const { testRunId, testRuns } = useContext(TestRunsContext);

  const { groupedTests, tests } = useTestRunDetailsSuspends(testRunId);
  const selectedSpecTests =
    // Select tests that not filtered in second panel
    tests
      ?.filter(
        t => filterTestsByText === "" || t.sourcePath.toLowerCase().includes(filterTestsByText)
      )
      ?.filter((t: any) => t.sourcePath === spec) ?? [];
  const selectedTest = selectedSpecTests?.[0];

  if (
    !spec ||
    groupedTests === null ||
    selectedTest == null ||
    !testRuns.some(t => t.id === testRunId)
  ) {
    return (
      <TestSuitePanelMessage data-test-id="NoTestSelected">
        Select a test to see its details here
      </TestSuitePanelMessage>
    );
  }

  const failedTests = selectedSpecTests.filter(t => t.result === "failed" || t.result === "flaky");

  return (
    <TestRunPanelWrapper>
      <div className="flex flex-grow flex-col gap-3 overflow-y-auto py-3">
        <div className="flex flex-col gap-2 px-3">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-semibold">
            Replays
          </div>
          <TestRunResultList selectedSpecTests={selectedSpecTests} />
        </div>
        {failedTests.length ? <Errors failedTests={failedTests} /> : null}
      </div>
    </TestRunPanelWrapper>
  );
}

interface ErrorCount {
  message: string;
  summary: string;
  count: number;
}

const getSummary = (message: string) => {
  const firstLine = message.split("\n")[0];

  if (firstLine.match(/^.*\dms: (.*)/)?.[1]) {
    return firstLine.match(/^.*\dms: (.*)/)![1];
  } else {
    return firstLine;
  }
};

function Errors({ failedTests }: { failedTests: TestRunTestWithRecordings[] }) {
  const { spec } = useContext(TestRunsContext);

  const sortedErrors = useMemo(() => {
    const errors = failedTests.flatMap(t => t.errors || []);
    const uniqueErrors = errors.reduce((acc, e) => {
      const existingError = acc.find(a => a.message === e);

      if (existingError) {
        existingError.count += 1;
      } else {
        acc.push({ message: e, count: 1, summary: getSummary(e) });
      }

      return acc;
    }, [] as ErrorCount[]);

    return uniqueErrors.sort((a, b) => b.count - a.count);
  }, [failedTests]);

  return (
    <div className="flex flex-col gap-2 px-3">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap text-lg font-semibold">
        Errors
      </div>
      {sortedErrors.map((e, i) => (
        <ErrorGroup key={`${spec}-${i}`} message={e.message} count={e.count} summary={e.summary} />
      ))}
    </div>
  );
}

function ErrorGroup({
  message,
  count,
  summary,
}: {
  message: string;
  count: number;
  summary: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex w-full flex-col gap-2 overflow-x-auto rounded-md bg-[color:var(--testsuites-v2-error-bg)] px-3 py-4"
      data-test-id="TestRunSpecDetails-Error"
    >
      <button
        className="flex flex-row items-start justify-between gap-1"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-0.5 flex items-center justify-center rounded-md bg-[color:var(--testsuites-failed-color)] px-2 py-0 text-xs font-bold text-white">
          {count}
        </div>
        <div className="ml-2 flex-grow truncate text-left">{summary}</div>
        <Icon
          data-test-id="TestRunResults-StatusGroup-Icon"
          data-test-state={expanded ? "expanded" : "collapsed"}
          className={`duration-140 mt-0.5 transition-transform ${
            expanded ? "rotate-0" : "rotate-90"
          }`}
          style={{ minWidth: "1rem", minHeight: "1rem" }}
          type="chevron-down"
        />
      </button>
      {expanded ? (
        <div className="mt-2 flex flex-col gap-4 whitespace-pre-wrap break-words ">
          <div className="font-mono text-xs">{message.split("\n").slice(0, 4).join("\n")}</div>
        </div>
      ) : null}
    </div>
  );
}
