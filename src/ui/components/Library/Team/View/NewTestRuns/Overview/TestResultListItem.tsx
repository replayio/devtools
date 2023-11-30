import { motion } from "framer-motion";
import { useRouter } from "next/router";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import {
  isGroupedTestCasesV1,
  isGroupedTestCasesV2,
} from "shared/test-suites/RecordingTestMetadata";
import { TestRunTest } from "shared/test-suites/TestRun";
import HighlightedText from "ui/components/Library/Team/View/NewTestRuns/HighlightedText";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { AttributeContainer } from "../../TestRuns/AttributeContainer";
import styles from "../../../../Library.module.css";

function RecordingAttributes({ recording }: { recording: Recording }) {
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
      {recording.user?.name ? (
        <AttributeContainer dataTestId="Recording-Username" icon="person">
          {recording.user.name}
        </AttributeContainer>
      ) : null}
    </div>
  );
}

export function TestResultListItem({
  depth,
  filterByText,
  label,
  recording,
  test,
}: {
  depth: number;
  filterByText: string;
  label: string;
  recording: Recording;
  test: TestRunTest;
}) {
  const { comments, isProcessed, id: recordingId } = recording;
  const { title } = test;

  const { apiKey, e2e } = useRouter().query;

  const numComments = comments?.length ?? 0;

  label = label.toLowerCase();

  let iconClass;
  switch (label) {
    case "failed":
      iconClass = "failed";
      break;
    case "flaky":
      iconClass = "flaky";
      break;
    case "passed":
    default:
      iconClass = "passed";
      break;
  }

  const iconType = isProcessed ? "play-processed" : "play-unprocessed";

  return (
    <a
      href={`/recording/${recordingId}?e2e=${e2e ?? ""}&apiKey=${apiKey ?? ""}`}
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
            <Icon className={styles[iconClass]} type={iconType} />
          </motion.div>
        </div>
      </div>
      <div className={`${styles.fileInfo} gap-1`}>
        <div className={styles.title}>{title || "Test"}</div>
        <RecordingAttributes recording={recording} />
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
