import React, { useState } from "react";
import CommentsPanel from "./CommentsPanel";
import classnames from "classnames";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import "./SecondaryToolbox.css";

function PanelButtons({ selectedPanel, setSelectedPanel, collapsed }) {
  // Remove comment-icon from image.js. -jaril
  return (
    <div className="panel-buttons">
      <button
        className={classnames({ expanded: selectedPanel === "console" && !collapsed })}
        onClick={() => setSelectedPanel("console")}
      >
        Console
      </button>
      <button
        className={classnames({ expanded: selectedPanel === "comments" && !collapsed })}
        onClick={() => setSelectedPanel("comments")}
      >
        Comments
      </button>
    </div>
  );
}

function ActionButtons({ setCollapsed, collapsed }) {
  // Implement a toggle collapse button
  return (
    <div className="action-buttons">
      <button disabled className="collapse-tabs-content" onClick={() => setCollapsed(!collapsed)}>
        Toggle Secondary Toolbox
      </button>
    </div>
  );
}

function ConsolePanel() {
  return (
    <div className="toolbox-bottom-panels" style={{ overflow: "hidden" }}>
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <WebConsoleApp />
      </div>
    </div>
  );
}

// This component re-renders every time you hover on a message in the console. Find
// out why. -jaril
export default function SecondaryToolbox() {
  const [selectedPanel, setSelectedPanel] = useState("console");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={classnames("secondary-toolbox", { collapsed })}>
      <header className="secondary-toolbox-header">
        <PanelButtons
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
          collapsed={collapsed}
        />
        <ActionButtons setCollapsed={setCollapsed} collapsed={collapsed} />
      </header>
      <div className="secondary-toolbox-content">
        {selectedPanel == "console" ? <ConsolePanel /> : <CommentsPanel />}
      </div>
    </div>
  );
}
