import React, { useState, useEffect } from "react";
import { connect } from "react-redux";

import Timeline from "../Timeline";
import Tooltip from "../Tooltip";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import CommentsPanel from "ui/components/SecondaryToolbox/CommentsPanel";
const EventListeners = require("devtools/client/debugger/src/components/SecondaryPanes/EventListeners")
  .default;
const Dropdown = require("ui/components/shared/Dropdown").default;

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";
import "./NonDevView.css";

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

function NonDevView({ updateTimelineDimensions }) {
  useEffect(() => {
    installObserver();
  }, []);

  const viewer = (
    <div id="outer-viewer">
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </div>
      <div id="toolbox-timeline">
        <Timeline />
        <Tooltip />
      </div>
    </div>
  );
  const rightSidebar = (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Transcript and Comments</div>
        <EventsFilter />
      </div>
      <CommentsPanel />
    </div>
  );

  const handleMove = num => {
    updateTimelineDimensions();
    prefs.nonDevSidePanelWidth = `${num}px`;
  };

  return (
    <SplitBox
      style={{ width: "100%", overflow: "hidden" }}
      splitterSize={1}
      initialSize={prefs.nonDevSidePanelWidth}
      minSize="20%"
      onMove={handleMove}
      maxSize="80%"
      vert={true}
      startPanel={viewer}
      endPanel={rightSidebar}
      endPanelControl={false}
    />
  );
}

export default connect(null, {
  updateTimelineDimensions,
})(NonDevView);
