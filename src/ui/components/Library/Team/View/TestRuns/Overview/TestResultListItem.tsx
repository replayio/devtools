import { motion } from "framer-motion";
import { useRouter } from "next/router";

import Icon from "replay-next/components/Icon";
import { Recording } from "shared/graphql/types";
import { TestRun, TestRunTest } from "shared/test-suites/TestRun";
import { trackEvent } from "ui/utils/telemetry";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { StatusIcon } from "../../Tests/Overview/StatusIcon";
import { AttributeContainer } from "../AttributeContainer";
import { TestRunLibraryRow } from "../TestRunLibraryRow";
import styles from "./TestResultListItem.module.css";

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

  return (
    <TestRunLibraryRow>
      <a
        href={`/recording/${recordingId}?e2e=${e2e ?? ""}&apiKey=${apiKey ?? ""}`}
        className={styles.recordingLink}
        data-test-id="TestRunResultsListItem"
        data-test-status={label}
        onClick={() => trackEvent("test_dashboard.open_replay", { view: "runs", result: label })}
      >
        <StatusIcon status={label} isProcessed={isProcessed} />
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
    </TestRunLibraryRow>
  );
}
