import { motion } from "framer-motion";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import {
  isGroupedTestCasesV1,
  isGroupedTestCasesV2,
} from "shared/test-suites/RecordingTestMetadata";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";
import MaterialIcon from "ui/components/shared/MaterialIcon";

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
  const { comments, metadata } = recording;

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

  let color;
  switch (label) {
    case "failed":
      color = "#EB5757";
      break;
    case "flaky":
      color = "#FDBA00";
      break;
    case "passed":
    default:
      color = "#219653";
      break;
  }

  return (
    <a
      href={`/recording/${recording.id}`}
      className={`${styles.recordingLink} ${styles.libraryRow}`}
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
            <MaterialIcon iconSize="2xl" outlined style={{ color }}>
              {["passed", "flaky"].includes(label) ? "play_circle" : "play_circle_filled"}
            </MaterialIcon>
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
