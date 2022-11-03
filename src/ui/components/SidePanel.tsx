import React, { useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import TestInfo from "devtools/client/debugger/src/components/TestInfo/TestInfo";
import Events from "ui/components/Events";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
import ProtocolViewer from "./ProtocolViewer";
import MaterialIcon from "./shared/MaterialIcon";
import Icon from "ui/components/shared/Icon";
import StatusDropdown from "./shared/StatusDropdown";

const FullTextSearch = require("devtools/client/debugger/src/components/FullTextSearch").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;
const Accordion = require("devtools/client/debugger/src/components/shared/Accordion").default;

function TestResultsSummary({ testCases }: { testCases: TestItem[] }) {
  const failed = testCases.filter(c => c.result === "failed").length;
  const passed = testCases.filter(c => c.result === "passed").length;

  return (
    <div className="flex gap-2 px-1 py-1 ml-4">
      <div className="flex items-center gap-1">
        <Icon filename="testsuites-success" size="small" className="bg-green-700" />
        <div className="text-green-700 text-sm">{passed}</div>
      </div>
      <div className="flex items-center gap-1 mr-1">
        <Icon filename="testsuites-fail" size="small" className="bg-red-500" />
        <div className="text-red-500 text-sm">{failed}</div>
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
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const items: any[] = [
    {
      header: "Info",
      buttons: resolveRecording ? <StatusDropdown /> : null,
      className: "replay-info",
      component: <ReplayInfo />,
      opened: !replayInfoCollapsed,
      onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
    },
  ];

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
          result={recording?.metadata?.test.result}
          spec={recording?.metadata?.test.file}
          testCases={recording?.metadata?.test.tests}
        />
      ),
      opened: !cypressCollapsed,
      onToggle: () => setCypressCollapsed(!setCypressCollapsed),
    });
  } else {
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
      {selectedPrimaryPanel === "search" && <FullTextSearch />}
      {selectedPrimaryPanel === "events" && <Accordion items={items} />}
      {selectedPrimaryPanel === "protocol" && <ProtocolViewer />}
    </div>
  );
}
