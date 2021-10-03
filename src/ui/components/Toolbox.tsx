import React from "react";

import DebuggerApp from "devtools/client/debugger/src/components/App";
import "./Toolbox.css";
import { Redacted } from "./Redacted";

export default function Toolbox() {
  return (
    <Redacted id="toolbox">
      <div className="toolbox-top-panels">
        <div className="toolbox-panel text-xs" id="toolbox-content-debugger">
          <DebuggerApp />
        </div>
      </div>
    </Redacted>
  );
}
