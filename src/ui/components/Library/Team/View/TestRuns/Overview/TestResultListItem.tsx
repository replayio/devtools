import { useRouter } from "next/router";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import { TestRunTest } from "shared/test-suites/TestRun";
import HighlightedText from "ui/components/Library/Team/View/TestRuns/HighlightedText";

import { StatusIcon } from "../../Tests/Overview/StatusIcon";
import styles from "../../../../Testsuites.module.css";

export function TestResultListItem({
  depth,
  filterByText,
  label,
  recording,
  secondaryBadgeCount,
  test,
}: {
  depth: number;
  filterByText: string;
  label: string;
  recording: Recording;
  secondaryBadgeCount: number | null;
  test: TestRunTest;
}) {
  const { comments, isProcessed, id: recordingId } = recording;
  const { sourcePath, title } = test;

  const { apiKey, e2e } = useRouter().query;

  const numComments = comments?.length ?? 0;

  label = label.toLowerCase();

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
        {secondaryBadgeCount != null && <Icon className={`${styles.icon}`} type="arrow-nested" />}
        <StatusIcon isProcessed={isProcessed} status={label} />
      </div>
      <div className={styles.fileInfo}>
        <div className={styles.title}>{title || "Test"}</div>
        {sourcePath && (
          <div className={styles.filePath}>
            <HighlightedText haystack={sourcePath} needle={filterByText} />
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
