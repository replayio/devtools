import React, { useMemo } from "react";

import TestInfo from "devtools/client/debugger/src/components/TestInfo/TestInfo";
import {
  setFocusRegionFromTimeRange,
  syncFocusedRegion,
  updateFocusRegionParam,
} from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";
import { useTestInfo } from "ui/hooks/useTestInfo";
import {
  getReporterAnnotationsForTests,
  getSelectedTest,
  setSelectedStep,
  setSelectedTest,
} from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Annotation, Recording, TestItem } from "ui/types";
import { getRecordingId } from "ui/utils/recording";

import { Attributes } from "./Library/Team/View/TestRuns/Overview/RunSummary";
import styles from "./SidePanel.module.css";

// The test start times in metadata may be incorrect. If we have the reporter annotations,
// we can use those instead
function maybeCorrectTestTimes(recording: Recording | void, annotations: Annotation[] | null) {
  const testCases = recording?.metadata?.test?.tests;
  return (
    testCases?.map((t, i) => ({
      ...t,
      relativeStartTime: annotations?.[i]?.time ? annotations?.[i]?.time : t.relativeStartTime,
    })) || []
  );
}

function getSpecFilename(recording: Recording | void) {
  const file = recording?.metadata?.test?.file || "";
  return file.includes("/") ? file.split("/").pop() : file;
}

function TestResultsSummary({ testCases }: { testCases: TestItem[] }) {
  const failed = testCases.filter(c => c.result === "failed").length;
  const passed = testCases.filter(c => c.result === "passed").length;

  return (
    <div className="ml-4 flex gap-2 px-1 py-1">
      <div className="flex items-center gap-1">
        <Icon filename="testsuites-success" size="small" className={styles.SuccessIcon} />
        <div className={`text-sm ${styles.SuccessText}`}>{passed}</div>
      </div>
      <div className="mr-1 flex items-center gap-1">
        <Icon filename="testsuites-fail" size="small" className={styles.ErrorIcon} />
        <div className={`text-sm ${styles.ErrorTextLighter}`}>{failed}</div>
      </div>
    </div>
  );
}

export function TestSuitePanel() {
  const dispatch = useAppDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const selectedTest = useAppSelector(getSelectedTest);
  const annotations = useAppSelector(getReporterAnnotationsForTests);
  const info = useTestInfo();
  const workspaceId = recording?.workspace?.id;

  const testCases = useMemo(
    () => maybeCorrectTestTimes(recording, annotations),
    [recording, annotations]
  );

  const onReset = () => {
    dispatch(setSelectedTest(null));
    dispatch(setSelectedStep(null));
    dispatch(setFocusRegionFromTimeRange(null));
    dispatch(syncFocusedRegion());
    dispatch(updateFocusRegionParam());
  };

  if (!info.isTestSuiteReplay) {
    // We shouldn't hit this because the toolbar button should not show for a
    // non-cypress replay and the panel should only be auto-selected for a
    // test suites replay.
    return null;
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className={styles.ToolbarHeader}>
        {selectedTest !== null ? (
          <button onClick={onReset} className="my-1 flex flex-grow gap-1 self-start truncate">
            <div
              className="img arrowhead-right mt-1 h-32 w-32"
              style={{ transform: "rotate(180deg)", marginTop: "2px" }}
            />
            <span className="flex-grow whitespace-normal text-left">
              {" "}
              {testCases[selectedTest].title}
            </span>
            {testCases[selectedTest].error ? (
              <Icon
                filename="testsuites-fail"
                size="small"
                className={`self-start ${styles.ErrorIcon}`}
              />
            ) : (
              <Icon
                filename="testsuites-success"
                size="medium"
                className={styles.SuccessIcon}
                style={{ alignSelf: "flex-start" }}
              />
            )}
          </button>
        ) : (
          <>
            <div className="flex flex-grow items-center ">
              <span className="flex-grow truncate pl-1">{getSpecFilename(recording)}</span>
            </div>
            <TestResultsSummary testCases={testCases} />
          </>
        )}
      </div>
      {workspaceId && info.testRunId ? (
        <TestRunAttributes workspaceId={workspaceId} testRunId={info.testRunId} />
      ) : null}
      {!info.loading ? (
        <TestInfo testCases={testCases} />
      ) : (
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="flex flex-grow flex-col space-y-1 overflow-auto px-2">Loading...</div>
        </div>
      )}
    </div>
  );
}

function TestRunAttributes({ workspaceId, testRunId }: { workspaceId: string; testRunId: string }) {
  const { testRun } = useGetTestRunForWorkspace(workspaceId, testRunId);
  const selectedTest = useAppSelector(getSelectedTest);
  const recordingId = getRecordingId();

  if (!testRun || selectedTest !== null) {
    return null;
  }

  const thisSpecRun = {
    ...testRun,
    recordings: testRun.recordings?.filter(r => r.id === recordingId),
  };

  return (
    <div className="p-2 pt-0">
      <Attributes testRun={thisSpecRun} />
    </div>
  );
}
