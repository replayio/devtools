import DebuggerApp from "devtools/client/debugger/src/components/App";
import React from "react";

export default function Toolbox() {
  return (
    <div id="toolbox">
      <div className="toolbox-top-panels">
        <div className="toolbox-panel text-xs" id="toolbox-content-debugger">
          <DebuggerApp />
        </div>
      </div>
    </div>
  );
}
