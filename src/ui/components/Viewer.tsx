import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import Video from "ui/components/Video";
import { getRecordingTarget } from "ui/reducers/app";
import { getShowVideoPanel, getToolboxLayout } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { ToolboxLayout } from "ui/state/layout";
import { prefs } from "ui/utils/prefs";

import SecondaryToolbox from "./SecondaryToolbox";
import Toolbox from "./Toolbox";

const useGetShowVideo = () => {
  const recordingTarget = useAppSelector(getRecordingTarget);
  const showVideoPanel = useAppSelector(getShowVideoPanel);
  return showVideoPanel && recordingTarget !== "node";
};

const Vertical = () => {
  const showVideo = useGetShowVideo();

  return (
    <PanelGroup
      autoSaveId="Viewer-Inner-Vertical"
      className="w-full overflow-hidden"
      direction="vertical"
    >
      {showVideo && (
        <>
          <Panel
            className="flex-column flex flex-1"
            defaultSize={50}
            id="video"
            minSize={10}
            order={1}
          >
            <div className="flex-column flex flex-1">
              <Video />
            </div>
          </Panel>
          <PanelResizeHandle className="h-2 w-full" />
        </>
      )}
      <Panel
        className="flex-column flex flex-1"
        defaultSize={50}
        id="secondary-toolbox"
        minSize={30}
        order={2}
      >
        <SecondaryToolbox />
      </Panel>
    </PanelGroup>
  );
};

const Horizontal = () => {
  const showVideo = useGetShowVideo();

  return (
    <PanelGroup
      autoSaveId="Viewer-Inner-Horizontal"
      className="w-full overflow-hidden"
      direction="horizontal"
    >
      <Panel
        className="flex flex-1 flex-row"
        defaultSize={50}
        id="secondary-toolbox"
        minSize={30}
        order={1}
      >
        <div className="flex flex-1 flex-row">
          <SecondaryToolbox />
          <PanelResizeHandle className="w-2" />
        </div>
      </Panel>
      {showVideo && (
        <Panel className="flex flex-1 flex-row" defaultSize={50} id="video" minSize={10} order={2}>
          <Video />
        </Panel>
      )}
    </PanelGroup>
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
  const toolboxLayout = useAppSelector(getToolboxLayout);

  return (
    <PanelGroup autoSaveId="Viewer-Outer" className="w-full overflow-hidden" direction="horizontal">
      {toolboxLayout === "ide" && (
        <>
          <Panel minSize={25} order={1}>
            <Toolbox />
          </Panel>
          <PanelResizeHandle className="h-full w-2" />{" "}
        </>
      )}
      <Panel minSize={25} order={2}>
        {toolboxLayout === "left" ? <Horizontal /> : <Vertical />}
      </Panel>
    </PanelGroup>
  );
}
