import React, { useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
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

const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;
const Accordion = require("devtools/client/debugger/src/components/shared/Accordion").default;

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
  const [cypressCollapsed, setCypressCollapsed] = useState(false);
  const [highlightedTest, setHighlightedTest] = useState<number | null>(null);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const items: any[] = [];

  if (recording?.metadata?.test?.tests?.length) {
    items.push({
      header: (
        <div className="flex flex-row items-center">
          <span className="flex-grow truncate">{recording?.metadata?.test?.file}</span>
          <TestResultsSummary testCases={recording?.metadata?.test?.tests} />
        </div>
      ),
      buttons: null,
      className: "cyress-info flex-1 border-t overflow-hidden border-themeBorder",
      component: (
        <TestInfo
          testCases={recording?.metadata?.test.tests}
          highlightedTest={highlightedTest}
          setHighlightedTest={setHighlightedTest}
        />
      ),
      opened: !cypressCollapsed,
      onToggle: () => setCypressCollapsed(!setCypressCollapsed),
    });
  } else {
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
  }

  return (
    <div
      className="w-full overflow-hidden rounded-lg bg-bodyBgcolor text-xs"
      data-test-id="leftSidebar"
    >
      {selectedPrimaryPanel === "explorer" && <PrimaryPanes />}
      {selectedPrimaryPanel === "debugger" && <SecondaryPanes />}
      {selectedPrimaryPanel === "comments" && <CommentCardsList />}
      {selectedPrimaryPanel === "events" && <Accordion items={items} />}
      {selectedPrimaryPanel === "protocol" && <ProtocolViewer />}
      {selectedPrimaryPanel === "search" && <SearchFilesReduxAdapter />}
    </div>
  );
}
