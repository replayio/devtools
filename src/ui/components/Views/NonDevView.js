import React, { useState, useEffect } from "react";
import { connect } from "react-redux";

import Timeline from "../Timeline";
import Tooltip from "../Tooltip";
import Video from "../Video";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import CommentsPanel from "ui/components/SecondaryToolbox/CommentsPanel";
import EventListeners from "devtools/client/debugger/src/components/SecondaryPanes/EventListeners";
import Dropdown from "ui/components/shared/Dropdown";

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";
import "./NonDevView.css";

export function EventsFilter() {
  const [expanded, setExpanded] = useState(TextTrackCueList);

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

export function TranscriptOptions({ showClicks, setShowClicks, clickEvents }) {
  const count = clickEvents.length;

  return (
    <div className="toolbar-options">
      <label htmlFor="show-clicks">
        <span>Show clicks</span>
        {!showClicks ? <span>{` (${count})`}</span> : null}
      </label>
      <input
        type="checkbox"
        id="show-clicks"
        checked={showClicks}
        onChange={() => setShowClicks(!showClicks)}
      />
    </div>
  );
}

function NonDevView({ updateTimelineDimensions, narrowMode, clickEvents }) {
  const [showClicks, setShowClicks] = useState(true);

  useEffect(() => {
    installObserver();
  }, [narrowMode]);

  const viewer = (
    <div className="vertical-panels">
      <Video />
      <div id="timeline-container">
        <Timeline />
        <Tooltip />
      </div>
    </div>
  );
  const rightSidebar = (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Transcript and Comments</div>
        <TranscriptOptions
          showClicks={showClicks}
          setShowClicks={setShowClicks}
          clickEvents={clickEvents}
        />
      </div>
      <CommentsPanel showClicks={showClicks} />
    </div>
  );

  const handleMove = num => {
    updateTimelineDimensions();
    prefs.nonDevSidePanelWidth = `${num}px`;
  };

  if (narrowMode) {
    return (
      <>
        <SplitBox
          style={{ width: "100%", overflow: "hidden" }}
          splitterSize={1}
          initialSize={prefs.nonDevSidePanelWidth}
          minSize="20%"
          onMove={handleMove}
          maxSize="80%"
          vert={false}
          startPanel={<Video />}
          endPanel={rightSidebar}
          endPanelControl={false}
        />
        <div id="timeline-container">
          <Timeline />
          <Tooltip />
        </div>
      </>
    );
  }

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

export default connect(
  state => ({
    narrowMode: selectors.getNarrowMode(state),
    clickEvents: selectors.getEventsForType(state, "mousedown"),
  }),
  {
    updateTimelineDimensions,
  }
)(NonDevView);
