import { Suspense } from "react";

import { assert } from "protocol/utils";
import Loader from "replay-next/components/Loader";
import { getFormattedTime } from "shared/utils/time";
import { getTruncatedRelativeDate } from "ui/components/Library/Team/View/Recordings/RecordingListItem/RecordingListItem";
import LabeledIcon from "ui/components/TestSuite/components/LabeledIcon";
import { TestResultIcon } from "ui/components/TestSuite/components/TestResultIcon";
import { RecordingCache } from "ui/components/TestSuite/suspense/RecordingCache";
import { TestMetadataCache } from "ui/components/TestSuite/suspense/TestMetadataCache";
import { ProcessedTestItem } from "ui/components/TestSuite/types";
import { formatTitle } from "ui/components/TestSuite/utils/formatTitle";
import { MissingStepsBanner } from "ui/components/TestSuite/views/TestMetadata/MissingStepsBanner";
import { useGetRecordingId } from "ui/hooks/recordings";

import TestItemTree from "./TestItemTree";
import styles from "./Panel.module.css";

export default function Panel({
  selectTestItem,
}: {
  selectTestItem: (testItem: ProcessedTestItem) => void;
}) {
  return (
    <Suspense fallback={<Loader />}>
      <PanelSuspends selectTestItem={selectTestItem} />
    </Suspense>
  );
}

function PanelSuspends({
  selectTestItem,
}: {
  selectTestItem: (testItem: ProcessedTestItem) => void;
}) {
  const recordingId = useGetRecordingId();

  const recording = RecordingCache.read(recordingId!);
  const testMetadata = TestMetadataCache.read(recordingId);

  const sourceMetadata = recording.metadata?.source;
  assert(sourceMetadata != null);

  const user = sourceMetadata.trigger?.user;
  const { branch, merge } = sourceMetadata;

  const { duration, hasMissingSteps, resultCounts, runner, title } = testMetadata;

  const durationString = getFormattedTime(duration, false);

  const testRunnerName = runner?.name ?? "unknown";

  return (
    <>
      <div className={styles.Header}>
        <div className={styles.SummaryRow}>
          <div className={styles.Title} title={title}>
            {formatTitle(title)}
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
          {user && <LabeledIcon className={styles.Attribute} icon="person" label={user} />}
          {merge?.id == null && branch && (
            <LabeledIcon className={styles.Attribute} icon="fork_right" label={branch} />
          )}
          {merge?.id && (
            <LabeledIcon className={styles.Attribute} icon="merge_type" label={merge.id} />
          )}
          <LabeledIcon className={styles.Attribute} icon="timer" label={durationString} />
        </div>
      </div>
      <div className={styles.TreeContainer}>
        {hasMissingSteps && <MissingStepsBanner testRunnerName={testRunnerName} />}
        <TestItemTree selectTestItem={selectTestItem} />
      </div>
    </>
  );
}
