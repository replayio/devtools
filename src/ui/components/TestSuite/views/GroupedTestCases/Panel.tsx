import assert from "assert";
import { useContext, useMemo } from "react";

import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { getFormattedTime } from "shared/utils/time";
import { getTruncatedRelativeDate } from "ui/components/Library/Team/View/Recordings/RecordingListItem/RecordingListItem";
import LabeledIcon from "ui/components/TestSuite/components/LabeledIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";
import { formatTitle } from "ui/components/TestSuite/utils/formatTitle";
import { createTestTree } from "ui/components/TestSuite/views/GroupedTestCases/createTestTree";
import { TestRecordingTree } from "ui/components/TestSuite/views/GroupedTestCases/TestRecordingTree";
import { TestSuiteContext } from "ui/components/TestSuite/views/TestSuiteContext";

import styles from "./Panel.module.css";

export default function Panel() {
  const { recordingId } = useContext(SessionContext);
  const { groupedTestCases } = useContext(TestSuiteContext);
  assert(groupedTestCases != null);

  const { approximateDuration, resultCounts, source, testRecordings } = groupedTestCases;
  const { filePath, title } = source;

  const durationString = getFormattedTime(approximateDuration);

  const testTree = useMemo(() => createTestTree(testRecordings), [testRecordings]);

  const recording = RecordingCache.read(recordingId);

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
            label={getTruncatedRelativeDate(recording.date)}
          />
          <Source />
          <LabeledIcon className={styles.Attribute} icon="timer" label={durationString} />
        </div>
      </div>
      <div className={styles.TreeContainer}>
        <TestRecordingTree testTree={testTree} />
      </div>
    </>
  );
}

function Source() {
  const { recordingId } = useContext(SessionContext);

  const recording = RecordingCache.read(recordingId);
  const source = recording.metadata?.source;
  if (source == null) {
    return null;
  }

  const { branch = "branch", merge, trigger } = source;

  return (
    <>
      {trigger?.user && (
        <LabeledIcon className={styles.Attribute} icon="person" label={trigger.user} />
      )}
      {merge != null ? (
        <LabeledIcon className={styles.Attribute} icon="fork_right" label={branch} />
      ) : (
        <LabeledIcon className={styles.Attribute} icon="merge_type" label={branch} />
      )}
    </>
  );
}
