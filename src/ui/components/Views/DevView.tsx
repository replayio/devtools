import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

import Timeline from "../Timeline";
import Viewer from "../Viewer";
import Toolbox from "../Toolbox";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";
import { UIState } from "ui/state";
import classNames from "classnames";

function DevView({
  updateTimelineDimensions,
  recordingTarget,
  showVideoPanel,
  showEditor,
  sidePanelCollapsed,
}: PropsFromRedux) {
  const videoIsHidden = !showVideoPanel || recordingTarget == "node";
  const handleMove = (num: number) => {
    updateTimelineDimensions();
    prefs.toolboxHeight = `${num}px`;
  };

  useEffect(() => {
    installObserver();
  }, []);

  return (
    <div className={classNames("horizontal-panels", { "video-hidden": videoIsHidden })}>
      <Toolbar />
      <div className="vertical-panels">
        <SplitBox
          style={{ width: "100%", overflow: "hidden" }}
          splitterSize={1}
          initialSize={prefs.toolboxHeight as string}
          minSize={showEditor || !sidePanelCollapsed ? "240px" : "0%"}
          maxSize={showEditor || !sidePanelCollapsed ? "80%" : "0%"}
          vert={true}
          onMove={handleMove}
          startPanel={<Toolbox />}
          endPanel={<Viewer showVideo={!videoIsHidden} vertical={!showEditor} />}
          endPanelControl={false}
        />
        <div className="timeline-container">
          <Timeline />
        </div>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingTarget: selectors.getRecordingTarget(state),
    showVideoPanel: selectors.getShowVideoPanel(state),
    showEditor: selectors.getShowEditor(state),
    sidePanelCollapsed: selectors.getPaneCollapse(state),
  }),
  {
    updateTimelineDimensions,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(DevView);
