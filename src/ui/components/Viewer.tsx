import { useRef, useState } from "react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

import Video from "ui/components/Video";
import { getToolboxLayout } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";

import SecondaryToolbox from "./SecondaryToolbox";
import Toolbox from "./Toolbox";

const Vertical = () => {
  const videoPanelRef = useRef<ImperativePanelHandle>(null);
  const [videoPanelCollapsed, setVideoPanelCollapsed] = useState(false);

  return (
    <PanelGroup
      autoSaveId="Viewer-Inner-Vertical"
      className="w-full overflow-hidden"
      direction="vertical"
    >
      <Panel
        className="flex-column flex flex-1"
        collapsible
        defaultSize={50}
        id="Panel-Video"
        minSize={10}
        onCollapse={setVideoPanelCollapsed}
        order={1}
        ref={videoPanelRef}
      >
        <div className="flex-column flex flex-1">
          <Video />
        </div>
      </Panel>
      <PanelResizeHandle
        className={videoPanelCollapsed ? "" : "h-2 w-full shrink-0"}
        id="PanelResizeHandle-Video"
      />
      <Panel
        className="flex-column flex flex-1"
        defaultSize={50}
        id="Panel-SecondaryToolbox"
        minSize={30}
        order={2}
      >
        <SecondaryToolbox videoPanelCollapsed={videoPanelCollapsed} videoPanelRef={videoPanelRef} />
      </Panel>
    </PanelGroup>
  );
};

const Horizontal = () => {
  const videoPanelRef = useRef<ImperativePanelHandle>(null);
  const [videoPanelCollapsed, setVideoPanelCollapsed] = useState(false);

  return (
    <PanelGroup
      autoSaveId="Viewer-Inner-Horizontal"
      className="w-full overflow-hidden"
      direction="horizontal"
    >
      <Panel
        className="flex flex-1 flex-row"
        defaultSize={50}
        id="Panel-SecondaryToolbox"
        minSize={30}
        order={1}
      >
        <div className="flex w-full flex-1 flex-row">
          <SecondaryToolbox
            videoPanelCollapsed={videoPanelCollapsed}
            videoPanelRef={videoPanelRef}
          />
          <PanelResizeHandle
            className={videoPanelCollapsed ? "" : "h-full w-2 shrink-0"}
            id="PanelResizeHandle-Video"
          />
        </div>
      </Panel>
      <Panel
        className="flex flex-1 flex-row"
        collapsible
        defaultSize={50}
        id="Panel-Video"
        minSize={10}
        onCollapse={setVideoPanelCollapsed}
        order={2}
        ref={videoPanelRef}
      >
        <Video />
      </Panel>
    </PanelGroup>
  );
};

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
