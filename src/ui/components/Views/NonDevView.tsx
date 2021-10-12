import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";

import Timeline from "../Timeline";
import Video from "../Video";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import SidePanel from "ui/components/SidePanel";
import EventListeners from "devtools/client/debugger/src/components/SecondaryPanes/EventListeners";
import Dropdown from "ui/components/shared/Dropdown";

import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";
import "./NonDevView.css";
import { UIState } from "ui/state";

export function EventsFilter() {
  const [expanded, setExpanded] = useState(false);

  const buttonContent = <div className="img settings" />;

  return (
    <div className="event-breakpoints">
      <Dropdown
        buttonContent={buttonContent}
        setExpanded={setExpanded}
        expanded={expanded}
        buttonStyle={"secondary"}
      >
        <EventListeners />
      </Dropdown>
    </div>
  );
}

function NonDevView({ updateTimelineDimensions }: PropsFromRedux) {
  const viewer = (
    <div className="vertical-panels">
      <Video />
      <div id="timeline-container">
        <Timeline />
      </div>
    </div>
  );

  const handleMove = (size: number) => {
    updateTimelineDimensions();
    prefs.sidePanelSize = `${size}px`;
  };

  return (
    <div className="flex flex-row h-full overflow-hidden">
      <Toolbar />
      <SplitBox
        startPanel={<SidePanel />}
        endPanel={viewer}
        initialSize={prefs.sidePanelSize as string}
        maxSize={"80%"}
        minSize={"240px"}
        onControlledPanelResized={handleMove}
        splitterSize={1}
        style={{ width: "100%", overflow: "hidden" }}
        vert={true}
      />
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
  }),
  {
    updateTimelineDimensions,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NonDevView);
