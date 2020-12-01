import React, { useEffect } from "react";
import { connect } from "react-redux";

import Timeline from "../Timeline";
import Tooltip from "../Tooltip";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import CommentsPanel from "ui/components/SecondaryToolbox/CommentsPanel";

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";

function NonDevView({ updateTimelineDimensions }) {
  useEffect(() => {
    installObserver();
  }, []);

  const viewer = (
    <div id="outer-viewer">
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </div>
      <div id="toolbox-timeline">
        <Timeline />
        <Tooltip />
      </div>
    </div>
  );

  const handleMove = num => {
    updateTimelineDimensions();
    prefs.nonDevSidePanelWidth = `${num}px`;
  };

  return (
    <>
      <SplitBox
        style={{ width: "100%", overflow: "hidden" }}
        splitterSize={1}
        initialSize={prefs.nonDevSidePanelWidth}
        minSize="20%"
        onMove={handleMove}
        maxSize="80%"
        vert={true}
        startPanel={viewer}
        endPanel={<CommentsPanel />}
        endPanelControl={false}
      />
    </>
  );
}

export default connect(null, {
  updateTimelineDimensions,
})(NonDevView);
