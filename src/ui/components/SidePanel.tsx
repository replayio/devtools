import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Transcript from "ui/components/Transcript";
import Events from "ui/components/Events";
import ReplayInfo from "./Events/ReplayInfo";
import PrimaryPanes from "devtools/client/debugger/src/components/PrimaryPanes";
import Accordion, { AccordionPane } from "./NewAccordion/Accordion";
const FullTextSearch = require("devtools/client/debugger/src/components/FullTextSearch").default;
const SecondaryPanes = require("devtools/client/debugger/src/components/SecondaryPanes").default;

type SidePanelProps = PropsFromRedux;

function SidePanel({ selectedPrimaryPanel }: SidePanelProps) {
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
      <Accordion>
        <AccordionPane
          header="Replay Info"
          className="replay-info"
          expanded={!replayInfoCollapsed}
          onToggle={() => setReplayInfoCollapsed(!replayInfoCollapsed)}
        >
          <ReplayInfo />
        </AccordionPane>
      </Accordion>
      // <Accordion
      //   items={[
      //     {
      //       header: "Replay Info",
      //       className: "replay-info",
      //       component: <ReplayInfo />,
      //       opened: !replayInfoCollapsed,
      //       onToggle: () => setReplayInfoCollapsed(!replayInfoCollapsed),
      //     },
      //     {
      //       header: "Events",
      //       className: "events-info flex-1 border-t overflow-hidden",
      //       component: <Events />,
      //       opened: !eventsCollapsed,
      //       onToggle: () => setEventsCollapsed(!eventsCollapsed),
      //     },
      //   ]}
      // />
    );
  }

  return <div className="w-full overflow-hidden rounded-lg bg-white">{sidepanel}</div>;
}

const connector = connect((state: UIState) => ({
  selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(SidePanel);
