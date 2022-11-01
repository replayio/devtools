import React from "react";

import ComputedProperties from "./ComputedProperties";
import ComputedToolbar from "./ComputedToolbar";

export default function ComputedApp() {
  return (
    <div id="sidebar-panel-computedview" className="theme-sidebar inspector-tabpanel">
      <ComputedToolbar />
      <ComputedProperties />
    </div>
  );
}
