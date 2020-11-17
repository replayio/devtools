import React, { useEffect, useState, useRef } from "react";
import RightSidebar from "./RightSidebar";
import Tooltip from "./Tooltip";
import Toast from "./Toast";
import { installObserver } from "../../protocol/graphics";

export default function Viewer({ tooltip }) {
  useEffect(() => {
    installObserver();
  }, []);

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
