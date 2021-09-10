import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";

import Timeline from "../Timeline";
import Viewer from "../Viewer";
import Toolbox from "../Toolbox";
import Toolbar from "../Toolbar";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import SecondaryToolbox from "../SecondaryToolbox";

import { installObserver } from "../../../protocol/graphics";
import { updateTimelineDimensions } from "../../actions/timeline";
import { prefs } from "../../utils/prefs";
import { selectors } from "../../reducers";
import { UIState } from "ui/state";
import SidePanel from "../SidePanel";
import classNames from "classnames";
import Video from "../Video";

function DevView({
  updateTimelineDimensions,
  recordingTarget,
  showVideoPanel,
  showEditor,
}: PropsFromRedux) {
  const videoIsHidden = !showVideoPanel || recordingTarget == "node";
  const handleMove = (num: number) => {
    updateTimelineDimensions();
    prefs.toolboxHeight = `${num}px`;
  };

  useEffect(() => {
    installObserver();
  }, []);

  // Case 1: editor: !shown, video: shown => Toolbar + Sidepanel + Splitter(SecondaryToolbox + Video)
  // Case 2: editor: !shown, video: !shown => Toolbar + Sidepanel + SecondaryToolbox

  if (!showEditor) {
    return (
      <div className={classNames("horizontal-panels", { "video-hidden": videoIsHidden })}>
        <Toolbar />
        <div className="vertical-panels">
          {videoIsHidden ? (
            <SplitBox
              style={{ width: "100%", overflow: "hidden" }}
              splitterSize={1}
              initialSize={"20%"}
              minSize="20%"
              maxSize="80%"
              vert={true}
              onMove={handleMove}
              startPanel={<SidePanel resizable />}
              endPanel={<SecondaryToolbox />}
              endPanelControl={false}
            />
          ) : (
            <div className="horizontal-panels">
              <SidePanel />
              <SplitBox
                style={{ width: "100%", overflow: "hidden" }}
                splitterSize={1}
                initialSize={prefs.toolboxHeight as string}
                minSize="20%"
                maxSize="80%"
                vert={true}
                onMove={handleMove}
                startPanel={<SecondaryToolbox />}
                endPanel={<Video />}
                endPanelControl={false}
              />
            </div>
          )}
          <div className="timeline-container">
            <Timeline />
          </div>
        </div>
      </div>
    );
  }

  // Case 3: editor: shown, video: shown => Toolbar + Splitter(Toolbox (Sidepanel + Editor) + Viewer (Video + SecondaryToolbox))
  // Case 4: editor: shown, video: !shown => Toolbar + Splitter(Toolbox (Sidepanel + Editor) + SecondaryToolbox)

  return (
    <div className={classNames("horizontal-panels", { "video-hidden": videoIsHidden })}>
      <Toolbar />
      <div className="vertical-panels">
        {videoIsHidden ? (
          <SplitBox
            style={{ width: "100%", overflow: "hidden" }}
            splitterSize={1}
            initialSize={prefs.toolboxHeight as string}
            minSize="20%"
            maxSize="80%"
            vert={true}
            onMove={handleMove}
            startPanel={<Toolbox />}
            endPanel={<SecondaryToolbox />}
            endPanelControl={false}
          />
        ) : (
          <SplitBox
            style={{ width: "100%", overflow: "hidden" }}
            splitterSize={1}
            initialSize={prefs.toolboxHeight as string}
            minSize="20%"
            maxSize="80%"
            vert={true}
            onMove={handleMove}
            startPanel={<Toolbox />}
            endPanel={<Viewer />}
            endPanelControl={false}
          />
        )}
        <div id="timeline-container">
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
  }),
  {
    updateTimelineDimensions,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(DevView);
