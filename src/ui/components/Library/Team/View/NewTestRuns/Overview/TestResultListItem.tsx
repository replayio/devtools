import { motion } from "framer-motion";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import { TestRun, TestRunTest } from "shared/test-suites/TestRun";
import { useGetRecordingURLForTest } from "ui/utils/recording";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../../TestRuns/AttributeContainer";
import styles from "../../../../Library.module.css";

function RecordingAttributes({
  recording,
  testRun,
}: {
  recording: Recording;
  testRun: TestRun | null;
}) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-4 text-xs">
      <AttributeContainer
        dataTestId="Recording-Date"
        icon="schedule"
        title={new Date(recording.date).toLocaleString()}
      >
        {getTruncatedRelativeDate(recording.date)}
      </AttributeContainer>

      {recording.duration && recording.duration > 0 ? (
        <AttributeContainer dataTestId="Recording-Duration" icon="timer">
          {getDurationString(recording.duration)}
        </AttributeContainer>
      ) : null}
      {testRun?.source?.user ? (
        <AttributeContainer dataTestId="Recording-Username" icon="person">
          {testRun.source.user}
        </AttributeContainer>
      ) : null}
    </div>
  );
}

export function TestResultListItem({
  depth,
  label,
  recording,
  testRun,
  test,
}: {
  depth: number;
  label: TestRunTest["result"];
  recording: Recording;
  testRun: TestRun | null;
  test: TestRunTest;
}) {
  const { comments, isProcessed, id: recordingId } = recording;
  const { title } = test;
  const recordingUrl = useGetRecordingURLForTest(recordingId);

  const numComments = comments?.length ?? 0;

  const iconType = isProcessed ? "play-processed" : "play-unprocessed";

  return (
    <a
      href={recordingUrl}
      className={`${styles.recordingLink} ${styles.libraryRow}`}
      data-test-id="TestRunResultsListItem"
      data-test-status={label}
      style={{
        paddingLeft: `${depth * 1}rem`,
      }}
    >
      <div className={styles.linkContent}>
        <div className={styles.iconWrapper}>
          <motion.div
            className={styles.iconMotion}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.05 }}
          >
            {/* We have class for failed, flaky and passed. Other status will be treated as failed (skipped, timedOut, unknown) */}
            <Icon className={styles[label] ?? styles.failed} type={iconType} />
          </motion.div>
        </div>
      </div>
      <div className={`${styles.fileInfo} gap-1`}>
        <div className={styles.title}>{title || "Test"}</div>
        <RecordingAttributes recording={recording} testRun={testRun} />
      </div>
      {numComments > 0 && (
        <div className={styles.comments}>
          <img src="/images/comment-outline.svg" className={styles.commentIcon} />
          <span>{numComments}</span>
        </div>
      )}
    </a>
  );
}
