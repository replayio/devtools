import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/router";
import { useState } from "react";

import { Recording } from "shared/graphql/types";
import {
  RootCauseAnalysisDataV3,
  isRootCauseAnalysisSummaryV3,
} from "shared/root-cause-analysis/RootCauseAnalysisData";
import { TestRun, TestRunTest } from "shared/test-suites/TestRun";
import { trackEvent } from "ui/utils/telemetry";

import {
  getDurationString,
  getTruncatedRelativeDate,
} from "../../Recordings/RecordingListItem/RecordingListItem";
import { StatusIcon } from "../../StatusIcon";
import {
  GET_RECORDING_ROOT_CAUSE_ANALYSIS_FULL,
  GET_RECORDING_ROOT_CAUSE_ANALYSIS_SUMMARY,
} from "../graphql/RootCauseAnalysisGraphQL";
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
  const { data: rootCauseAnalysisEntry } =
    useQuery<RootCauseAnalysisDataV3.RootCauseAnalysisDatabaseSummary>(
      GET_RECORDING_ROOT_CAUSE_ANALYSIS_SUMMARY,
      {
        variables: { recordingId },
      }
    );
  const { title } = test;

  const { apiKey, e2e } = useRouter().query;

  const numComments = comments?.length ?? 0;

  let rootCauseAnalysisSummary: RootCauseAnalysisDataV3.RootCauseAnalysisDatabaseSummary | null =
    null;

  if (rootCauseAnalysisEntry != null && isRootCauseAnalysisSummaryV3(rootCauseAnalysisEntry)) {
    rootCauseAnalysisSummary = rootCauseAnalysisEntry;
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
      {rootCauseAnalysisSummary ? (
        <RootCauseCollapsibleWrapper
          analysis={rootCauseAnalysisSummary}
          recordingId={recording.id}
        />
      ) : null}
    </div>
  );
}

function RootCauseCollapsibleWrapper({
  recordingId,
  analysis,
}: {
  recordingId: string;
  analysis: RootCauseAnalysisDataV3.RootCauseAnalysisDatabaseSummary;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const { analysisStatus, analysisSkipReason } = analysis;

  if (analysisStatus === "Skipped") {
    return <div className="pl-9">Analysis skipped: {analysisSkipReason}</div>;
  } else if (analysisStatus === "Failure") {
    return <div className="pl-9">Analysis failed</div>;
  }

  return (
    <>
      <button onClick={() => setCollapsed(!collapsed)} className="flex flex-row gap-1">
        <div className="font-mono">{collapsed ? "▶" : "▼"}</div>
        <div>Root cause available</div>
      </button>
      {!collapsed ? <RootCauseDisplay recordingId={recordingId} /> : null}
    </>
  );
}

function RootCauseDisplay({ recordingId }: { recordingId: string }) {
  const { data: rootCauseAnalysis, error } =
    useQuery<RootCauseAnalysisDataV3.RootCauseAnalysisDatabaseJson>(
      GET_RECORDING_ROOT_CAUSE_ANALYSIS_FULL,
      {
        variables: { recordingId },
      }
    );

  if (!rootCauseAnalysis) {
    return null;
  }

  const { discrepancies } = rootCauseAnalysis.result;

  return (
    <div className="flex flex-col gap-2 pl-9">
      {discrepancies?.map((d, i) => (
        <RootCause key={i} discrepancy={d} />
      ))}
    </div>
  );
}
