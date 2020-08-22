import React, { useState } from "react";
import ReactDOM from "react-dom";
import EventsTimeline from "./EventsTimeline";

export default function RightSidebar({}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="events-timeline">
      <EventsTimeline expanded={expanded} />
      <div className="right-sidebar">
        <button className="comment-button-container" onClick={() => setExpanded(!expanded)}>
          <div className="img comment-icon"></div>
        </button>
      </div>
    </div>
  );
}
