import React, { useMemo, useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";
import Accordion from "devtools/client/debugger/src/components/shared/Accordion";
import TestInfo from "devtools/client/debugger/src/components/TestInfo/TestInfo";
import { getRecordingDuration } from "ui/actions/app";
import { setFocusRegion } from "ui/actions/timeline";
import Events from "ui/components/Events";
import SearchFilesReduxAdapter from "ui/components/SearchFilesReduxAdapter";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { getReporterAnnotationsForTests, setSelectedStep } from "ui/reducers/reporter";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Annotation, Recording, TestItem } from "ui/types";

import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
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

function TestResultsSummary({ testCases }: { testCases: TestItem[] }) {
  const failed = testCases.filter(c => c.result === "failed").length;
  const passed = testCases.filter(c => c.result === "passed").length;

  return (
    <div className="ml-4 flex gap-2 px-1 py-1">
      <div className="flex items-center gap-1">
        <Icon filename="testsuites-success" size="small" className="bg-green-700" />
        <div className="text-sm text-green-700">{passed}</div>
      </div>
      <div className="mr-1 flex items-center gap-1">
        <Icon filename="testsuites-fail" size="small" className="bg-red-500" />
        <div className="text-sm text-red-500">{failed}</div>
      </div>
    </div>
  );
}

export default function SidePanel() {
  const { value: resolveRecording } = useFeature("resolveRecording");
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);

  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);
  const [highlightedTest, setHighlightedTest] = useState<number | null>(null);

  const items: any[] = [];

  // if (recording?.metadata?.test?.tests?.length) {
  items.push(
    {
      header: "Info",
      buttons: resolveRecording ? <StatusDropdown /> : null,
      className: "replay-info",
      component: <ReplayInfo />,
      opened: !replayInfoCollapsed,
      onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
    },
    {
      header: "Events",
      buttons: null,
      className: "events-info flex-1 border-t overflow-hidden border-themeBorder",
      component: <Events />,
      opened: !eventsCollapsed,
      onToggle: () => setEventsCollapsed(!eventsCollapsed),
    }
  );

  return (
    <div
      className="w-full overflow-hidden rounded-lg bg-bodyBgcolor text-xs"
      data-test-id="leftSidebar"
    >
      {selectedPrimaryPanel === "explorer" && <PrimaryPanes />}
      {selectedPrimaryPanel === "debugger" && <SecondaryPanes />}
      {selectedPrimaryPanel === "comments" && <CommentCardsList />}
      {selectedPrimaryPanel === "events" && (
        <EventsPane
          items={items}
          highlightedTest={highlightedTest}
          setHighlightedTest={setHighlightedTest}
        />
      )}
      {selectedPrimaryPanel === "protocol" && <ProtocolViewer />}
      {selectedPrimaryPanel === "search" && <SearchFilesReduxAdapter />}
    </div>
  );
}

function EventsPane({
  items,
  highlightedTest,
  setHighlightedTest,
}: {
  items: any[];
  highlightedTest: number | null;
  setHighlightedTest: (test: number | null) => void;
}) {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const annotations = useAppSelector(getReporterAnnotationsForTests);
  const dispatch = useAppDispatch();
  const duration = useAppSelector(getRecordingDuration);

  const testCases = useMemo(
    () => maybeCorrectTestTimes(recording, annotations),
    [recording, annotations]
  );

  const onReset = () => {
    setHighlightedTest(null);
    dispatch(setSelectedStep(null));
    dispatch(
      setFocusRegion({
        beginTime: 0,
        endTime: duration,
      })
    );
  };

  if (recording?.metadata?.test?.tests?.length) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className={styles.ToolbarHeader}>
          {highlightedTest !== null ? (
            <button onClick={onReset} className="flex flex-grow items-center truncate ">
              <MaterialIcon>chevron_left</MaterialIcon>
              <span className="flex-grow  text-left"> {testCases[highlightedTest].title}</span>
            </button>
          ) : (
            <>
              <div className="flex flex-grow items-center ">
                <span className="flex-grow truncate pl-1">{getSpecFilename(recording)}</span>
              </div>
              <TestResultsSummary testCases={recording?.metadata?.test?.tests} />
            </>
          )}
        </div>
        <TestInfo
          testCases={testCases}
          highlightedTest={highlightedTest}
          setHighlightedTest={setHighlightedTest}
        />
      </div>
    );
  }

  return <Accordion items={items} />;
}
