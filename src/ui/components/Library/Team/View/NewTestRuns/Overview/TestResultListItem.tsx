import { motion } from "framer-motion";
import { useRouter } from "next/router";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import { TestRun, TestRunTest } from "shared/test-suites/TestRun";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../../TestRuns/AttributeContainer";
import styles from "../../../../Testsuites.module.css";

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

  const { apiKey, e2e } = useRouter().query;

  const numComments = comments?.length ?? 0;

  const iconType = isProcessed ? "play-processed" : "play-unprocessed";

  return (
    <a
      href={`/recording/${recordingId}?e2e=${e2e ?? ""}&apiKey=${apiKey ?? ""}`}
      className={`${styles.recordingLink} ${styles.libraryRow}`}
      data-test-id="TestRunResultsListItem"
      data-test-status={label}
    >
      <div className={styles.linkContent}>
        <div className={styles.iconWrapper}>
          <motion.div
            className={styles.iconMotion}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
            transition={{ duration: 0.05 }}
          >
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
