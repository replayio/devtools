import React from "react";
import SecondaryToolbox from "./SecondaryToolbox";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { prefs } from "ui/utils/prefs";
import Video from "ui/components/Video";
import { useSelector } from "react-redux";
import { getShowVideoPanel, getToolboxLayout } from "ui/reducers/layout";
import { getRecordingTarget } from "ui/reducers/app";
import { ToolboxLayout } from "ui/state/layout";
import { getPaneCollapse } from "devtools/client/debugger/src/selectors";
import Toolbox from "./Toolbox";

const useGetShowVideo = () => {
  const recordingTarget = useSelector(getRecordingTarget);
  const showVideoPanel = useSelector(getShowVideoPanel);
  return showVideoPanel && recordingTarget !== "node";
};

const Vertical = () => {
  const showVideo = useGetShowVideo();

  return (
    <SplitBox
      style={{ width: "100%", overflow: "hidden" }}
      splitterSize={8}
      initialSize={prefs.secondaryPanelHeight.toString() as `${number}px`}
      onResizeEnd={(size: string) => {
        prefs.secondaryPanelHeight = size;
      }}
      minSize={showVideo ? "10%" : "100%"}
      maxSize={showVideo ? "70%" : "100%"}
      vert={true}
      startPanel={<SecondaryToolbox />}
      endPanel={showVideo && <Video />}
      endPanelControl={false}
    />
  );
};

const Horizontal = () => {
  const showVideo = useGetShowVideo();

  return (
    <SplitBox
      style={{ width: "100%", overflow: "hidden" }}
      splitterSize={8}
      initialSize={prefs.secondaryPanelHeight.toString() as `${number}px`}
      onResizeEnd={(size: string) => {
        prefs.secondaryPanelHeight = size;
      }}
      minSize={showVideo ? "10%" : "0"}
      maxSize={showVideo ? "70%" : "0"}
      vert={false}
      startPanel={showVideo && <Video />}
      endPanel={<SecondaryToolbox />}
      endPanelControl={false}
    />
  );
};

function minSize(sidePanelCollapsed: boolean, toolboxLayout: ToolboxLayout): `${number}px` {
  if (!sidePanelCollapsed && toolboxLayout === "ide") {
    return "300px";
  }

  if (!sidePanelCollapsed || toolboxLayout === "ide") {
    return "200px";
  }

  return "0px";
}

function maxSize(
  sidePanelCollapsed: boolean,
  toolboxLayout: ToolboxLayout
): `${number}` | `${number}%` | `${number}px` {
  if (toolboxLayout === "ide") {
    return "80%";
  }

  if (sidePanelCollapsed) {
    return "0";
  }

  return String(prefs.sidePanelSize) as `${number}px`;
}

export default function Viewer() {
  const toolboxLayout = useSelector(getToolboxLayout);
  const sidePanelCollapsed = useSelector(getPaneCollapse);

  return (
    <SplitBox
      startPanel={toolboxLayout === "ide" ? <Toolbox /> : null}
      endPanel={toolboxLayout === "left" ? <Vertical /> : <Horizontal />}
      endPanelControl={false}
      initialSize={prefs.toolboxSize as `${number}px`}
      minSize={minSize(sidePanelCollapsed, toolboxLayout)}
      maxSize={maxSize(sidePanelCollapsed, toolboxLayout)}
      onMove={(num: number) => (prefs.toolboxSize = `${num}px`)}
      splitterSize={8}
      style={{ width: "100%", overflow: "hidden" }}
      vert={true}
    />
  );
}
