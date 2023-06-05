import assert from "assert";
import { useContext, useMemo } from "react";

import { TestSuiteSourceMetadata } from "shared/test-suites/types";
import { getFormattedTime } from "shared/utils/time";
import { getTruncatedRelativeDate } from "ui/components/Library/Team/View/Recordings/RecordingListItem/RecordingListItem";
import LabeledIcon from "ui/components/TestSuite/components/LabeledIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";
import { formatTitle } from "ui/components/TestSuite/utils/formatTitle";
import { createTestTree } from "ui/components/TestSuite/views/GroupedTestCases/createTestTree";
import { TestRecordingTree } from "ui/components/TestSuite/views/GroupedTestCases/TestRecordingTree";
import { TestSuiteContext } from "ui/components/TestSuite/views/TetSuiteContext";

import styles from "./Panel.module.css";

export default function Panel() {
  const { groupedTestCases } = useContext(TestSuiteContext);
  assert(groupedTestCases != null);

  const { approximateDuration, date, filePath, resultCounts, source, testRecordings, title } =
    groupedTestCases;

  const durationString = getFormattedTime(approximateDuration);

  const testTree = useMemo(() => createTestTree(testRecordings), [testRecordings]);

  return (
    <>
      <div className={styles.Header}>
        <div className={styles.SummaryRow}>
          <div className={styles.Title} title={title ?? filePath}>
            {formatTitle(title ?? filePath)}
          </div>
          <div className={styles.ResultIconAndLabel} data-status="passed">
            <TestResultIcon result="passed" /> {resultCounts.passed}
          </div>
          <div className={styles.ResultIconAndLabel} data-status="failed">
            <TestResultIcon result="failed" /> {resultCounts.failed}
          </div>
          {resultCounts.skipped > 0 && (
            <div className={styles.ResultIconAndLabel} data-status="skipped">
              <TestResultIcon result="skipped" /> {resultCounts.skipped}
            </div>
          )}
        </div>
        <div className={styles.Attributes}>
          <LabeledIcon
            className={styles.Attribute}
            icon="schedule"
            label={getTruncatedRelativeDate(date)}
          />
          {source && <Source source={source} />}
          <LabeledIcon className={styles.Attribute} icon="timer" label={durationString} />
        </div>
      </div>
      <div className={styles.TreeContainer}>
        <TestRecordingTree testTree={testTree} />
      </div>
    </>
  );
}

function Source({ source }: { source: TestSuiteSourceMetadata }) {
  const { branchName, branchStatus, user } = source;

  return (
    <>
      {user && <LabeledIcon className={styles.Attribute} icon="person" label={user} />}
      {branchStatus === "open" ? (
        <LabeledIcon className={styles.Attribute} icon="fork_right" label={branchName} />
      ) : (
        <LabeledIcon className={styles.Attribute} icon="merge_type" label={branchStatus} />
      )}
    </>
  );
}
