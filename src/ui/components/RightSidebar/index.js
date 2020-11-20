import React, { useState } from "react";
import EventsTimeline from "./EventsTimeline";
import classnames from "classnames";
import { connect } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import "./RightSidebar.css";

function Tooltip({ tooltip, drawerNode }) {
  const top = tooltip.targetNode.top - drawerNode.getBoundingClientRect().top;

  return (
    <div className="tooltip" style={{ top: top }}>
      {tooltip.name}
    </div>
  );
}

function Buttons({ tooltip, setTooltip }) {
  const [commentButtonNode, setCommentButtonNode] = useState(null);
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
        className="expanded"
        style={{ marginRight: "12px" }}
        // onClick={() => setExpanded(expanded === "comments" ? null : "comments")}
        ref={node => setCommentButtonNode(node)}
        onMouseEnter={() => handleMouseEnter(commentButtonNode, "Comments")}
        onMouseLeave={handleMouseLeave}
      >
        Console
      </button>
      <button
        className="expanded"
        // onClick={() => setExpanded(expanded === "comments" ? null : "comments")}
        ref={node => setCommentButtonNode(node)}
        onMouseEnter={() => handleMouseEnter(commentButtonNode, "Comments")}
        onMouseLeave={handleMouseLeave}
      >
        <div className="img comment-icon"></div>
      </button>
    </div>
  );
}

function _Drawer({ toggleToolbox, toolboxExpanded }) {
  const [tooltip, setTooltip] = useState(null);
  const [drawerNode, setDrawerNode] = useState(null);
  const dir = toolboxExpanded ? "up" : "down";

  return (
    <div className="drawer" ref={node => setDrawerNode(node)}>
      <Buttons tooltip={tooltip} setTooltip={setTooltip} />
      {/* {tooltip ? <Tooltip tooltip={tooltip} drawerNode={drawerNode} /> : null} */}
      {/* <div className="bottom-buttons">
        <div className={`img arrow-${dir}`} onClick={toggleToolbox}></div>
      </div> */}
      {/* jaril1 */}
    </div>
  );
}

const Drawer = connect(state => ({ toolboxExpanded: selectors.getToolboxExpanded(state) }), {
  toggleToolbox: actions.toggleToolbox,
})(_Drawer);

export default function RightSidebar({}) {
  const selectedPanel = useState("console");
  const bottomPanel = (
    <div className="toolbox-bottom-panels" style={{ overflow: "hidden" }}>
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <WebConsoleApp />
      </div>
    </div>
  );

  return (
    <div className="right-sidebar">
      <Drawer />
      {bottomPanel}
      {/* <EventsTimeline /> */}
      {/* {expanded === "event-logpoints" && <EventListeners />} */}
    </div>
  );
}
