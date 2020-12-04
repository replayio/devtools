import React, { useEffect } from "react";
import SecondaryToolbox from "./SecondaryToolbox";
import SplitBox from "devtools-splitter";
import { installObserver } from "../../protocol/graphics";
import { prefs } from "ui/utils/prefs";

export default function Viewer() {
  useEffect(() => {
    installObserver();
  }, []);

  return (
    <div id="outer-viewer">
      <SplitBox
        style={{ width: "100%", overflow: "hidden" }}
        splitterSize={1}
        initialSize={prefs.secondaryPanelHeight}
        onResizeEnd={num => {
          prefs.secondaryPanelHeight = `${num}px`;
        }}
        minSize="20%"
        maxSize="80%"
        vert={false}
        startPanel={
          <div id="viewer">
            <canvas id="graphics"></canvas>
            <div id="highlighter-root"></div>
          </div>
        }
        endPanel={<SecondaryToolbox />}
        endPanelControl={false}
      />
    </div>
  );
}
