import { RefObject, useContext, useLayoutEffect, useRef } from "react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";
import Video from "ui/components/Video/Video";
import { getToolboxLayout } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { ToolboxLayout } from "ui/state/layout";

import SecondaryToolbox from "./SecondaryToolbox";
import Toolbox from "./Toolbox";

const Vertical = ({
  onVideoPanelCollapse,
  toolboxLayout,
  videoPanelCollapsed,
  videoPanelRef,
}: {
  onVideoPanelCollapse: (collapsed: boolean) => void;
  toolboxLayout: ToolboxLayout;
  videoPanelCollapsed: boolean;
  videoPanelRef: RefObject<ImperativePanelHandle>;
}) => {
  return (
    <PanelGroup
      autoSaveId="Viewer-Inner-Vertical"
      className="w-full overflow-hidden"
      direction="vertical"
    >
      {toolboxLayout !== "full" && (
        <>
          <Panel
            className="overflow-hidden"
            collapsible
            defaultSize={50}
            id="Panel-Video"
            minSize={10}
            onCollapse={() => onVideoPanelCollapse(true)}
            onExpand={() => onVideoPanelCollapse(false)}
            order={1}
            ref={videoPanelRef}
          >
            <Video />
          </Panel>
          <PanelResizeHandle className={videoPanelCollapsed ? "" : "h-1 w-full shrink-0"} />
        </>
      )}
      <Panel
        className="flex-column flex flex-1"
        defaultSize={50}
        id="Panel-SecondaryToolbox"
        minSize={30}
        order={2}
      >
        <SecondaryToolbox />
      </Panel>
    </PanelGroup>
  );
};

const Horizontal = ({
  onVideoPanelCollapse,
  videoPanelCollapsed,
  videoPanelRef,
}: {
  onVideoPanelCollapse: (collapsed: boolean) => void;
  videoPanelCollapsed: boolean;
  videoPanelRef: RefObject<ImperativePanelHandle>;
}) => {
  const replayClient = useContext(ReplayClientContext);
  const recordingCapabilities = recordingCapabilitiesCache.read(replayClient);

  return (
    <PanelGroup
      autoSaveId="Viewer-Inner-Horizontal"
      className="w-full overflow-hidden"
      direction="horizontal"
    >
      <Panel
        className="flex flex-1 flex-row"
        defaultSize={50}
        id={
          recordingCapabilities.supportsRepaintingGraphics
            ? "Panel-SecondaryToolbox"
            : "Panel-Toolbox"
        }
        minSize={30}
        order={1}
      >
        <div className="flex w-full flex-1 flex-row">
          {recordingCapabilities.supportsRepaintingGraphics ? <SecondaryToolbox /> : <Toolbox />}
          <PanelResizeHandle className={videoPanelCollapsed ? "" : "h-full w-1 shrink-0"} />
        </div>
      </Panel>
      <Panel
        className="flex flex-1 flex-row"
        collapsible
        defaultSize={50}
        id={
          recordingCapabilities.supportsRepaintingGraphics
            ? "Panel-Video"
            : "Panel-SecondaryToolbox"
        }
        minSize={10}
        onCollapse={() => onVideoPanelCollapse(true)}
        onExpand={() => onVideoPanelCollapse(false)}
        order={2}
        ref={videoPanelRef}
      >
        {recordingCapabilities.supportsRepaintingGraphics ? <Video /> : <SecondaryToolbox />}
      </Panel>
    </PanelGroup>
  );
};

export default function Viewer() {
  const toolboxLayout = useAppSelector(getToolboxLayout);

  const videoPanelRef = useRef<ImperativePanelHandle>(null);

  const [videoPanelCollapsed, setVideoPanelCollapsed] = useLocalStorageUserData(
    "replayVideoPanelCollapsed"
  );

  const onVideoPanelCollapse = (collapsed: boolean) => {
    setVideoPanelCollapsed(collapsed);
  };

  useLayoutEffect(() => {
    const videoPanel = videoPanelRef.current;
    if (videoPanel) {
      if (videoPanelCollapsed) {
        videoPanel.collapse();
      } else {
        videoPanel.expand();
      }
    }
  }, [videoPanelCollapsed]);

  return (
    <PanelGroup autoSaveId="Viewer-Outer" className="w-full overflow-hidden" direction="horizontal">
      {toolboxLayout === "ide" && (
        <>
          <Panel minSize={25} order={1}>
            <Toolbox />
          </Panel>
          <PanelResizeHandle className="h-full w-1" />{" "}
        </>
      )}
      <Panel minSize={25} order={2}>
        {toolboxLayout === "left" ? (
          <Horizontal
            onVideoPanelCollapse={onVideoPanelCollapse}
            videoPanelCollapsed={videoPanelCollapsed}
            videoPanelRef={videoPanelRef}
          />
        ) : (
          <Vertical
            onVideoPanelCollapse={onVideoPanelCollapse}
            toolboxLayout={toolboxLayout}
            videoPanelCollapsed={videoPanelCollapsed}
            videoPanelRef={videoPanelRef}
          />
        )}
      </Panel>
    </PanelGroup>
  );
}
