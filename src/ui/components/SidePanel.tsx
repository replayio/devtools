import React, { useState } from "react";

import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import TestInfo from "devtools/client/debugger/src/components/TestInfo/TestInfo";
import Events from "ui/components/Events";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";

import CommentCardsList from "./Comments/CommentCardsList";
import ReplayInfo from "./Events/ReplayInfo";
import ProtocolViewer from "./ProtocolViewer";
import StatusDropdown from "./shared/StatusDropdown";

const FullTextSearch = require("devtools/client/debugger/src/components/FullTextSearch").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;
const Accordion = require("devtools/client/debugger/src/components/shared/Accordion").default;

export default function SidePanel() {
  const { value: resolveRecording } = useFeature("resolveRecording");
  const selectedPrimaryPanel = useAppSelector(getSelectedPrimaryPanel);

  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);
  const [cypressCollapsed, setCypressCollapsed] = useState(false);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const items = [
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
      header: `Test Info (${recording?.metadata?.test?.tests?.length})`,
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
