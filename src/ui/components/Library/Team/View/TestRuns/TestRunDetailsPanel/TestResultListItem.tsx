import { useRouter } from "next/router";
import { useState } from "react";

import { GetTestRunRecordings_node_Workspace_testRuns_edges_node_tests_executions_recordings_rootCauseAnalysis } from "shared/graphql/generated/GetTestRunRecordings";
import { Recording } from "shared/graphql/types";
import {
  RootCauseAnalysisDataV1,
  isRootCauseAnalysisDataV1,
} from "shared/root-cause-analysis/RootCauseAnalysisData";
import { TestRun, TestRunTest } from "shared/test-suites/TestRun";
import { trackEvent } from "ui/utils/telemetry";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { StatusIcon } from "../../StatusIcon";
import { RootCause } from "../RootCause/RootCause";
import { TestRunLibraryRow } from "../TestRunLibraryRow";
import { AttributeContainer } from "./AttributeContainer";
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

  let rootCauseAnalysis: RootCauseAnalysisDataV1.RootCauseAnalysisDatabaseJson | null = null;

  if (
    recording.rootCauseAnalysis != null &&
    isRootCauseAnalysisDataV1(recording.rootCauseAnalysis)
  ) {
    rootCauseAnalysis = recording.rootCauseAnalysis;
  }

  return (
    <div className="flex flex-col">
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
      {rootCauseAnalysis ? <RootCauseDisplay analysis={rootCauseAnalysis} /> : null}
    </div>
  );
}

function RootCauseDisplay({
  analysis,
}: {
  analysis: RootCauseAnalysisDataV1.RootCauseAnalysisDatabaseJson;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const { result, skipReason, discrepancies } = analysis.result;

  if (result === "Skipped") {
    return <div className="pl-9">Analysis skipped: {skipReason}</div>;
  }

  return (
    <div className="flex flex-col gap-2 pl-9">
      <button onClick={() => setCollapsed(!collapsed)} className="flex flex-row gap-1">
        <div className="font-mono">{collapsed ? "▶" : "▼"}</div>
        <div>Root cause available</div>
      </button>
      {discrepancies && !collapsed
        ? discrepancies.map((d, i) => <RootCause key={i} discrepancy={d} />)
        : null}
    </div>
  );
}
