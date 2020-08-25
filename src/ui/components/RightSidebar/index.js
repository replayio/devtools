import React, { useState } from "react";
import ReactDOM from "react-dom";
import EventsTimeline from "./EventsTimeline";
import Intercom from "./Intercom";

import "./RightSidebar.css";

export default function RightSidebar({}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="right-sidebar">
      <EventsTimeline expanded={expanded} />
      <div className="drawer">
        <button className="comment-button-container" onClick={() => setExpanded(!expanded)}>
          <div className="img comment-icon"></div>
        </button>
        <Intercom />
      </div>
    </div>
  );
}
