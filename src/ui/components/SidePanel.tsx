import React, { useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import SecondaryPanes from "devtools/client/debugger/src/components/SecondaryPanes";
import Accordion from "devtools/client/debugger/src/components/shared/Accordion";
import TestInfo from "devtools/client/debugger/src/components/TestInfo/TestInfo";
import Events from "ui/components/Events";
import SearchFilesReduxAdapter from "ui/components/SearchFilesReduxAdapter";
import Icon from "ui/components/shared/Icon";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
import ProtocolViewer from "./ProtocolViewer";
import StatusDropdown from "./shared/StatusDropdown";
import styles from "./SidePanel.module.css";

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

  if (recording?.metadata?.test?.tests?.length) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className={styles.ToolbarHeader}>
          <span className="flex-grow truncate">{recording?.metadata?.test?.file}</span>
          <TestResultsSummary testCases={recording?.metadata?.test?.tests} />
        </div>
        <TestInfo
          testCases={recording?.metadata?.test.tests}
          highlightedTest={highlightedTest}
          setHighlightedTest={setHighlightedTest}
        />
      </div>
    );
  }

  return <Accordion items={items} />;
}
