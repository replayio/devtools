import React, { useEffect } from "react";
import { connect } from "react-redux";

import Timeline from "../Timeline";
import Viewer from "../Viewer";
import Tooltip from "../Tooltip";
import Toolbox from "../Toolbox";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";

function DevView({ updateTimelineDimensions }) {
  const handleMove = num => {
    updateTimelineDimensions();
    prefs.toolboxHeight = `${num}px`;
  };

  useEffect(() => {
    installObserver();
  }, []);

  return (
    <div className="dev-view-outer">
      <Toolbar />
      <div className="dev-view-inner">
        <SplitBox
          style={{ width: "100%", overflow: "hidden" }}
          splitterSize={1}
          initialSize={prefs.toolboxHeight}
          minSize="20%"
          maxSize="80%"
          vert={true}
          onMove={handleMove}
          startPanel={<Toolbox />}
          endPanel={<Viewer />}
          endPanelControl={false}
        />
        <div id="toolbox-timeline">
          <Timeline />
          <Tooltip />
        </div>
      </div>
    </div>
  );
}

export default connect(null, {
  updateTimelineDimensions,
})(DevView);
