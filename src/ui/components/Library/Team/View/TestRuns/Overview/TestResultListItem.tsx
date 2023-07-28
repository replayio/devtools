import { motion } from "framer-motion";
import { useRouter } from "next/router";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import {
  isGroupedTestCasesV1,
  isGroupedTestCasesV2,
} from "shared/test-suites/RecordingTestMetadata";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";

import styles from "../../../../Library.module.css";

export function TestResultListItem({
  depth,
  filterByText,
  label,
  recording,
  secondaryBadgeCount,
}: {
  depth: number;
  filterByText: string;
  label: string;
  recording: Recording;
  secondaryBadgeCount: number | null;
}) {
  const { comments, metadata, isProcessed } = recording;

  const { apiKey, e2e } = useRouter().query;

  const numComments = comments?.length ?? 0;

  let filePath = "";
  let title = "";

  const testMetadata = metadata?.test;
  if (testMetadata != null) {
    if (isGroupedTestCasesV1(testMetadata)) {
      filePath = testMetadata.path?.[2] ?? "";
      title = testMetadata.title;
    } else if (isGroupedTestCasesV2(testMetadata)) {
      filePath = testMetadata.source.path;
      title = testMetadata.source.title || "";
    } else {
      filePath = testMetadata.source.filePath;
      title = testMetadata.source.title || "";
    }
  }

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
      href={`/recording/${recording.id}?e2e=${e2e ?? ""}&apiKey=${apiKey ?? ""}`}
      className={`${styles.recordingLink} ${styles.libraryRow}`}
      data-test-id="TestRunResultsListItem"
      data-test-status={label}
      style={{
        paddingLeft: `${depth * 1}rem`,
      }}
    >
      <div className={styles.linkContent}>
        {secondaryBadgeCount != null && <Icon className={`${styles.icon}`} type="arrow-nested" />}
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
      <div className={styles.fileInfo}>
        <div className={styles.title}>{title || "Test"}</div>
        {filePath && (
          <div className={styles.filePath}>
            <HighlightedText haystack={filePath} needle={filterByText} />
          </div>
        )}
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
