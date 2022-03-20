import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";

import Timeline from "../Timeline";
import Video from "../Video";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import SidePanel from "ui/components/SidePanel";
import EventListeners from "devtools/client/debugger/src/components/SecondaryPanes/EventListeners";
import Dropdown from "ui/components/shared/Dropdown";

import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";
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

function NonDevView({ sidePanelCollapsed }: PropsFromRedux) {
  const viewer = (
    <div className="vertical-panels">
      <Video />
    </div>
  );

  const handleMove = (size: number) => {
    prefs.sidePanelSize = `${size}px`;
  };

  return (
    <div className="vertical-panels pr-2">
      <div className="flex h-full flex-row overflow-hidden bg-chrome">
        <Toolbar />
        <SplitBox
          startPanel={<SidePanel />}
          endPanel={viewer}
          initialSize={prefs.sidePanelSize as `${number}px`}
          maxSize={sidePanelCollapsed ? "0" : "80%"}
          minSize={sidePanelCollapsed ? "0" : "240px"}
          onControlledPanelResized={handleMove}
          splitterSize={8}
          style={{ width: "100%", overflow: "hidden" }}
          vert={true}
        />
      </div>
      <Timeline />
    </div>
  );
}

const connector = connect((state: UIState) => ({
  selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
  sidePanelCollapsed: selectors.getPaneCollapse(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(NonDevView);
