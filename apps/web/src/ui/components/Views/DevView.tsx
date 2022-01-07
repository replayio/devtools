import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

import Timeline from "../Timeline";
import Viewer from "../Viewer";
import Toolbox from "../Toolbox";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";

import { installObserver } from "../../../protocol/graphics";
import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";
import { UIState } from "ui/state";

function minSize(sidePanelCollapsed: boolean, showEditor: boolean): string {
  if (!sidePanelCollapsed && showEditor) {
    return "300px";
  }

  if (!sidePanelCollapsed || showEditor) {
    return "200px";
  }

  return "0px";
}

function maxSize(sidePanelCollapsed: boolean, showEditor: boolean) {
  if (showEditor) {
    return "80%";
  }

  if (sidePanelCollapsed) {
    return "0";
  }

  return String(prefs.sidePanelSize);
}

function DevView({
  recordingTarget,
  showVideoPanel,
  showEditor,
  sidePanelCollapsed,
}: PropsFromRedux) {
  const videoIsHidden = !showVideoPanel || recordingTarget == "node";
  const handleMove = (num: number) => {
    prefs.toolboxSize = `${num}px`;
  };

  useEffect(() => {
    installObserver();
  }, []);

  return (
    <div className="vertical-panels pr-2">
      <div className="horizontal-panels bg-chrome">
        <Toolbar />
        <SplitBox
          style={{ width: "100%", overflow: "hidden" }}
          splitterSize={8}
          initialSize={prefs.toolboxSize as string}
          minSize={minSize(sidePanelCollapsed, showEditor)}
          maxSize={maxSize(sidePanelCollapsed, showEditor)}
          vert={true}
          onMove={handleMove}
          startPanel={<Toolbox />}
          endPanel={<Viewer showVideo={!videoIsHidden} vertical={!showEditor} />}
          endPanelControl={false}
        />
      </div>
      <div className="timeline-container">
        <Timeline />
      </div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  recordingTarget: selectors.getRecordingTarget(state),
  showVideoPanel: selectors.getShowVideoPanel(state),
  showEditor: selectors.getShowEditor(state),
  sidePanelCollapsed: selectors.getPaneCollapse(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(DevView);
