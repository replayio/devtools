import React from "react";

import DebuggerApp from "devtools/client/debugger/src/components/App";
import Toolbar from "./Toolbar";
import "./Toolbox.css";

export default function Toolbox() {
  return (
    <div id="toolbox">
      <Toolbar />
      <div className="toolbox-top-panels">
        <div className="toolbox-panel" id="toolbox-content-debugger">
          <DebuggerApp />
        </div>
      </div>
    </div>
  );
}
