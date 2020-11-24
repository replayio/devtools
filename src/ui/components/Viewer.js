import React, { useEffect } from "react";
import SecondaryToolbox from "./SecondaryToolbox";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { installObserver } from "../../protocol/graphics";

export default function Viewer() {
  useEffect(() => {
    installObserver();
  }, []);

  return (
    <div id="outer-viewer">
      <SplitBox
        style={{ width: "100%", overflow: "hidden" }}
        splitterSize={1}
        initialSize="50%"
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
