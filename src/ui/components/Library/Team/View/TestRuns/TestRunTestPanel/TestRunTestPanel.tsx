import { useContext, useMemo, useState } from "react";

import Icon from "replay-next/components/Icon";
import { TestRunTestWithRecordings } from "shared/test-suites/TestRun";

import { TestSuitePanelMessage } from "../../TestSuitePanelMessage";
import { useTestRunDetailsSuspends } from "../hooks/useTestRunDetailsSuspends";
import { TestRunPanelWrapper } from "../TestRunPanelWrapper";
import { TestRunsContext } from "../TestRunsContextRoot";
import { ExecutionList } from "./ExecutionList";
import styles from "./TestRunTestPanel.module.css";

export function TestRunTestPanel() {
  const { testId, filterTestsByText } = useContext(TestRunsContext);
  const { testRunIdForSuspense: testRunId, testRuns } = useContext(TestRunsContext);

  const { groupedTests, tests } = useTestRunDetailsSuspends(testRunId);
  const selectedSpecTests =
    // Select tests that not filtered in second panel
    tests
      ?.filter(
        t => filterTestsByText === "" || t.sourcePath.toLowerCase().includes(filterTestsByText)
      )
      ?.filter(t => t.testId === testId) ?? [];
  const selectedTest = selectedSpecTests?.[0];

  if (!tests?.length) {
    return (
      <TestSuitePanelMessage data-test-id="NoTestData">
        No test data available for this test run
      </TestSuitePanelMessage>
    );
  } else if (
    !testId ||
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
      <div className={styles.mainContainer}>
        <div className={styles.subContainer}>
          <div className={styles.title}>Replays</div>
          <ExecutionList selectedSpecTests={selectedSpecTests} />
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

  return firstLine.match(/^.*\dms: (.*)/)?.[1] ?? firstLine;
};

function Errors({ failedTests }: { failedTests: TestRunTestWithRecordings[] }) {
  const { testId } = useContext(TestRunsContext);

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
    <div className={styles.subContainer}>
      <div className={styles.title}>Errors</div>
      {sortedErrors.map((e, i) => (
        <ErrorGroup
          key={`${testId}-${i}`}
          message={e.message}
          count={e.count}
          summary={e.summary}
        />
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
    <div className={styles.errorGroupContainer} data-test-id="TestRunSpecDetails-Error">
      <button className={styles.errorToggleButton} onClick={() => setExpanded(!expanded)}>
        <div className={styles.errorCountLabel}>{count}</div>
        <div className={styles.errorSummary}>{summary}</div>
        <Icon
          data-test-id="TestRunResults-StatusGroup-Icon"
          data-test-state={expanded ? "expanded" : "collapsed"}
          className={`${styles.errorToggleIcon} ${expanded ? "rotate-0" : "rotate-90"}`}
          type="chevron-down"
        />
      </button>
      {expanded ? (
        <div className={styles.errorDetails}>
          <div className="font-mono text-xs">{message.split("\n").slice(0, 4).join("\n")}</div>
        </div>
      ) : null}
    </div>
  );
}
