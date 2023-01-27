import React, { useEffect, useMemo, useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";
import Accordion from "devtools/client/debugger/src/components/shared/Accordion";
import TestInfo from "devtools/client/debugger/src/components/TestInfo/TestInfo";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import {
  setFocusRegionFromTimeRange,
  syncFocusedRegion,
  updateFocusRegionParam,
} from "ui/actions/timeline";
import Events from "ui/components/Events";
import SearchFilesReduxAdapter from "ui/components/SearchFilesReduxAdapter";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { useGetTestRunForWorkspace } from "ui/hooks/tests";
import { getFlatEvents } from "ui/reducers/app";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import {
  getReporterAnnotationsForTests,
  getSelectedTest,
  setSelectedStep,
  setSelectedTest,
} from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Annotation, Recording, TestItem } from "ui/types";
import { getRecordingId } from "ui/utils/recording";

import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
import { Attributes } from "./Library/Team/View/TestRuns/Overview/RunSummary";
import ProtocolViewer from "./ProtocolViewer";
import StatusDropdown from "./shared/StatusDropdown";
import styles from "./SidePanel.module.css";

// The test start times in metadata may be incorrect. If we have the reporter annotations,
// we can use those instead
function maybeCorrectTestTimes(recording: Recording | void, annotations: Annotation[]) {
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

function isTestSuitesReplay(recording?: Recording) {
  return !!recording?.metadata?.test?.tests?.length;
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

function useInitialPrimaryPanel() {
  const dispatch = useAppDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);
  const events = useAppSelector(getFlatEvents);

  const initialPrimaryPanel = isTestSuitesReplay(recording) ? "cypress" : "events";

  useEffect(() => {
    if (selectedPrimaryPanel == null) {
      dispatch(setSelectedPrimaryPanel(initialPrimaryPanel));
    }
  }, [dispatch, selectedPrimaryPanel, initialPrimaryPanel]);

  return selectedPrimaryPanel || initialPrimaryPanel;
}

export default function SidePanel() {
  const { value: resolveRecording } = useFeature("resolveRecording");
  const selectedPrimaryPanel = useInitialPrimaryPanel();
  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);

  const items: any[] = [];

  // if (recording?.metadata?.test?.tests?.length) {
  items.push({
    header: "Info",
    buttons: resolveRecording ? <StatusDropdown /> : null,
    className: "replay-info",
    component: <ReplayInfo />,
    opened: !replayInfoCollapsed,
    onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
  });

  if (events.length > 0) {
    items.push({
      header: "Events",
      buttons: null,
      className: "events-info flex-1 border-t overflow-hidden border-themeBorder",
      component: <Events />,
      opened: !eventsCollapsed,
      onToggle: () => setEventsCollapsed(!eventsCollapsed),
    });
  }

  return (
    <div
      className="w-full overflow-hidden rounded-lg bg-bodyBgcolor text-xs"
      data-test-id="leftSidebar"
    >
      {selectedPrimaryPanel === "explorer" && <PrimaryPanes />}
      {selectedPrimaryPanel === "debugger" && <SecondaryPanes />}
      {selectedPrimaryPanel === "comments" && <CommentCardsList />}
      {selectedPrimaryPanel === "events" && <EventsPane items={items} />}
      {selectedPrimaryPanel === "cypress" && <TestSuitePanel />}
      {selectedPrimaryPanel === "protocol" && <ProtocolViewer />}
      {selectedPrimaryPanel === "search" && <SearchFilesReduxAdapter />}
    </div>
  );
}

function TestSuitePanel() {
  const dispatch = useAppDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const selectedTest = useAppSelector(getSelectedTest);
  const annotations = useAppSelector(getReporterAnnotationsForTests);

  const workspaceId = recording?.workspace?.id;
  const testRunId = recording?.metadata?.test?.run?.id;

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

  if (!isTestSuitesReplay(recording)) {
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
      {workspaceId && testRunId ? (
        <TestRunAttributes workspaceId={workspaceId} testRunId={testRunId} />
      ) : null}
      {annotations ? (
        <TestInfo testCases={testCases} />
      ) : (
        <div className="flex flex-grow flex-col overflow-hidden">
          <div className="flex flex-grow flex-col space-y-1 overflow-auto px-2">Loading...</div>
        </div>
      )}
    </div>
  );
}

function EventsPane({ items }: { items: any[] }) {
  return <Accordion items={items} />;
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
