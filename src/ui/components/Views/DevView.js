import React, { useEffect } from "react";
import { connect } from "react-redux";

import Timeline from "../Timeline";
import Viewer from "../Viewer";
import Tooltip from "../Tooltip";
import Toolbox from "../Toolbox";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import SecondaryToolbox from "../SecondaryToolbox";

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";

function DevView({ updateTimelineDimensions, narrowMode }) {
  const handleMove = num => {
    updateTimelineDimensions();
    prefs.toolboxHeight = `${num}px`;
  };

  useEffect(() => {
    installObserver();
  }, []);

  if (narrowMode) {
    return (
      <>
        <SplitBox
          style={{ width: "100%", overflow: "hidden" }}
          splitterSize={1}
          initialSize={prefs.toolboxHeight}
          minSize="20%"
          maxSize="80%"
          vert={false}
          onMove={handleMove}
          startPanel={
            <div className="horizontal-panels">
              <Toolbar />
              <Toolbox />
            </div>
          }
          endPanel={<SecondaryToolbox />}
          endPanelControl={false}
        />
        <div id="timeline-container">
          <Timeline />
        </div>
      </>
    );
  }

  return (
    <div className="horizontal-panels">
      <Toolbar />
      <div className="vertical-panels">
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
        <div id="timeline-container">
          <Timeline />
        </div>
      </div>
    </div>
  );
}

export default connect(
  state => ({
    narrowMode: selectors.getNarrowMode(state),
  }),
  {
    updateTimelineDimensions,
  }
)(DevView);
