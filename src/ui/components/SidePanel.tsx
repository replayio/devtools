import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Transcript from "ui/components/Transcript";
import Events from "ui/components/Events";
import ReplayInfo from "./Events/ReplayInfo";
const PrimaryPanes = require("devtools/client/debugger/src/components/PrimaryPanes").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;
const Accordion = require("devtools/client/debugger/src/components/shared/Accordion").default;

type SidePanelProps = PropsFromRedux;

function SidePanel({ selectedPrimaryPanel }: SidePanelProps) {
  let sidepanel;
  const [replayInfoCollapsed, setReplayInfoCollapsed] = useState(false);
  const [eventsCollapsed, setEventsCollapsed] = useState(false);

  if (selectedPrimaryPanel === "explorer") {
    sidepanel = <PrimaryPanes />;
  } else if (selectedPrimaryPanel === "debug") {
    sidepanel = <SecondaryPanes />;
  } else if (selectedPrimaryPanel === "comments") {
    sidepanel = <Transcript />;
  } else if (selectedPrimaryPanel === "events") {
    sidepanel = (
      <Accordion
        items={[
          {
            header: "Replay Info",
            className: "replay-info",
            component: <ReplayInfo />,
            opened: !replayInfoCollapsed,
            onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
          },
          {
            header: "Events",
            className: "events-info flex-1 border-t",
            component: <Events />,
            opened: !eventsCollapsed,
            onToggle: () => setEventsCollapsed(!eventsCollapsed),
          },
        ]}
      />
    );
  }

  return <div className="rounded-lg overflow-hidden w-full mt-2 mr-2">{sidepanel}</div>;
}

const connector = connect((state: UIState) => ({
  selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SidePanel);
