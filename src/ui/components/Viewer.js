import React, { useEffect, useState, useRef } from "react";
import RightSidebar from "./RightSidebar";
import Tooltip from "./Tooltip";
import Toast from "./Toast";

export default function Viewer({ tooltip }) {
  return (
    <div id="outer-viewer">
      <Toast />
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </div>
      <RightSidebar />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}
