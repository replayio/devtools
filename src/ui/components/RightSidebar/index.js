import React, { useState } from "react";
import ReactDOM from "react-dom";
import EventsTimeline from "./EventsTimeline";
import Intercom from "./Intercom";
import EventListeners from "devtools/client/debugger/src/components/SecondaryPanes/EventListeners";

import "./RightSidebar.css";

export default function RightSidebar({}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="right-sidebar">
      {expanded === "comments" && <EventsTimeline expanded={expanded} />}
      {expanded === "events" && <EventListeners />}
      <div className="drawer">
        <div className="buttons">
          <button
            className="comment-button-container"
            onClick={() => setExpanded(expanded === "comments" ? null : "comments")}
          >
            <div className="img comment-icon"></div>
          </button>
          <button
            className="comment-button-container"
            onClick={() => setExpanded(expanded === "events" ? null : "events")}
          >
            <div className="img lightning"></div>
          </button>
        </div>

        <Intercom />
      </div>
    </div>
  );
}
