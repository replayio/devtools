import React, { useEffect, useState, useRef } from "react";
import RightSidebar from "./RightSidebar";
import Toast from "./Toast";
import { installObserver } from "../../protocol/graphics";

export default function Viewer() {
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
    </div>
  );
}
