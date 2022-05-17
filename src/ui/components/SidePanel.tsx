import React, { useState } from "react";
import Transcript from "ui/components/Transcript";
import Events from "ui/components/Events";
import ReplayInfo from "./Events/ReplayInfo";
import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import StatusDropdown from "./shared/StatusDropdown";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { useSelector } from "react-redux";
import ProtocolViewer from "./ProtocolViewer";
const FullTextSearch = require("devtools/client/debugger/src/components/FullTextSearch").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;
const Accordion = require("devtools/client/debugger/src/components/shared/Accordion").default;

export default function SidePanel() {
  const { value: resolveRecording } = useFeature("resolveRecording");
  const selectedPrimaryPanel = useSelector(getSelectedPrimaryPanel);

  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);

  return (
    <div className="w-full overflow-hidden rounded-lg bg-bodyBgcolor text-xs">
      {selectedPrimaryPanel === "explorer" && <PrimaryPanes />}
      {selectedPrimaryPanel === "debugger" && <SecondaryPanes />}
      {selectedPrimaryPanel === "comments" && <Transcript />}
      {selectedPrimaryPanel === "search" && <FullTextSearch />}
      {selectedPrimaryPanel === "events" && (
        <Accordion
          items={[
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
              className: "events-info flex-1 border-t overflow-hidden border-themeBorder",
              component: <Events />,
              opened: !eventsCollapsed,
              onToggle: () => setEventsCollapsed(!eventsCollapsed),
            },
          ]}
        />
      )}
      {selectedPrimaryPanel === "protocol" && <ProtocolViewer />}
    </div>
  );
}
