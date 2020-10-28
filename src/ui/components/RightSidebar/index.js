import React, { useState } from "react";
import ReactDOM from "react-dom";
import EventsTimeline from "./EventsTimeline";
import Intercom from "./Intercom";
import EventListeners from "devtools/client/debugger/src/components/SecondaryPanes/EventListeners";
import Breakpoints from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints";
import classnames from "classnames";
import "./RightSidebar.css";

function Tooltip({ tooltip, drawerNode }) {
  const top = tooltip.targetNode.top - drawerNode.getBoundingClientRect().top;

  return (
    <div className="tooltip" style={{ top: top }}>
      {tooltip.name}
    </div>
  );
}

function Buttons({ setExpanded, expanded, tooltip, setTooltip }) {
  const [commentButtonNode, setCommentButtonNode] = useState(null);
  const [eventButtonNode, setEventButtonNode] = useState(null);
  const [breakpointsButtonNode, setBreakpointsButtonNode] = useState(null);
  const [nextAction, setNextAction] = useState(null);

  const handleMouseEnter = (node, name) => {
    const target = node;
    const id = setTimeout(() => {
      setTooltip({ name, targetNode: target.getBoundingClientRect() });
    }, 200);

    clearTimeout(nextAction);
    setNextAction(id);
  };
  const handleMouseLeave = e => {
    const id = setTimeout(() => {
      setTooltip(null);
    }, 200);

    clearTimeout(nextAction);
    setNextAction(id);
  };

  return (
    <div className="drawer-buttons">
      <button
        className={classnames({ expanded: expanded === "comments" })}
        onClick={() => setExpanded(expanded === "comments" ? null : "comments")}
        ref={node => setCommentButtonNode(node)}
        onMouseEnter={() => handleMouseEnter(commentButtonNode, "Comments")}
        onMouseLeave={handleMouseLeave}
      >
        <div className="img comment-icon" />
      </button>
      <button
        className={classnames({ expanded: expanded === "event-logpoints" })}
        onClick={() => setExpanded(expanded === "event-logpoints" ? null : "event-logpoints")}
        ref={node => setEventButtonNode(node)}
        onMouseEnter={() => handleMouseEnter(eventButtonNode, "Event Logpoints")}
        onMouseLeave={handleMouseLeave}
      >
        <div className="img lightning" />
      </button>
      <button
        className={classnames({ expanded: expanded === "breakpoints" })}
        onClick={() => setExpanded(expanded === "breakpoints" ? null : "breakpoints")}
        ref={node => setBreakpointsButtonNode(node)}
        onMouseEnter={() => handleMouseEnter(breakpointsButtonNode, "Logpoints")}
        onMouseLeave={handleMouseLeave}
      >
        <div className="img logpoint" />
      </button>
    </div>
  );
}

function Drawer({ setExpanded, expanded }) {
  const [tooltip, setTooltip] = useState(null);
  const [drawerNode, setDrawerNode] = useState(null);

  return (
    <div className="drawer" ref={node => setDrawerNode(node)}>
      <Buttons
        setExpanded={setExpanded}
        expanded={expanded}
        tooltip={tooltip}
        setTooltip={setTooltip}
      />
      {tooltip ? <Tooltip tooltip={tooltip} drawerNode={drawerNode} /> : null}
    </div>
  );
}

export default function RightSidebar({}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="right-sidebar">
      {expanded === "comments" && <EventsTimeline expanded={expanded} />}
      {expanded === "event-logpoints" && <EventListeners />}
      {expanded === "breakpoints" && <Breakpoints sidebar />}
      <Drawer setExpanded={setExpanded} expanded={expanded} />
    </div>
  );
}
