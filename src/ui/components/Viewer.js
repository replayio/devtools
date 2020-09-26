import React from "react";
import RightSidebar from "./RightSidebar";
import Tooltip from "./Tooltip";

export default function Viewer({ tooltip }) {
  return (
    <div id="outer-viewer">
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </div>
      <RightSidebar />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}
