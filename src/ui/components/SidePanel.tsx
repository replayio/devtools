import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import Events from "ui/components/Events";
import Transcript from "ui/components/Transcript";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";

import ReplayInfo from "./Events/ReplayInfo";
import StatusDropdown from "./shared/StatusDropdown";

const FullTextSearch = require("devtools/client/debugger/src/components/FullTextSearch").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;
const Accordion = require("devtools/client/debugger/src/components/shared/Accordion").default;

export default function SidePanel() {
  const { value: resolveRecording } = useFeature("resolveRecording");
  const selectedPrimaryPanel = useSelector(getSelectedPrimaryPanel);

  let sidepanel;
  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);

  if (selectedPrimaryPanel === "explorer") {
    sidepanel = <PrimaryPanes />;
  } else if (selectedPrimaryPanel === "debugger") {
    sidepanel = <SecondaryPanes />;
  } else if (selectedPrimaryPanel === "comments") {
    sidepanel = <Transcript />;
  } else if (selectedPrimaryPanel === "search") {
    sidepanel = <FullTextSearch />;
  } else if (selectedPrimaryPanel === "events") {
    sidepanel = (
      <Accordion
        items={[
          {
            buttons: resolveRecording ? <StatusDropdown /> : null,
            className: "replay-info",
            component: <ReplayInfo />,
            header: "Info",
            onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
            opened: !replayInfoCollapsed,
          },
          {
            className: "events-info flex-1 border-t overflow-hidden border-themeBorder",
            component: <Events />,
            header: "Events",
            onToggle: () => setEventsCollapsed(!eventsCollapsed),
            opened: !eventsCollapsed,
          },
        ]}
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg bg-bodyBgcolor text-xs">{sidepanel}</div>
  );
}
