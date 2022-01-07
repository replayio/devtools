import React from "react";
import SecondaryToolbox from "./SecondaryToolbox";
import SplitBox from "devtools/packages/devtools-splitter";
import { prefs } from "ui/utils/prefs";
import Video from "ui/components/Video";

interface ViewerProps {
  vertical: boolean;
  showVideo: boolean;
}

const Vertical = ({ showVideo }: ViewerProps) => {
  return (
    <SplitBox
      style={{ width: "100%", overflow: "hidden" }}
      splitterSize={8}
      initialSize={prefs.secondaryPanelHeight}
      onResizeEnd={(num: number) => {
        prefs.secondaryPanelHeight = `${num}px`;
      }}
      minSize={showVideo ? "20%" : "100%"}
      maxSize={showVideo ? "80%" : "100%"}
      vert={true}
      startPanel={<SecondaryToolbox />}
      endPanel={showVideo && <Video />}
      endPanelControl={false}
    />
  );
};

const Horizontal = ({ showVideo }: ViewerProps) => {
  return (
    <SplitBox
      style={{ width: "100%", overflow: "hidden" }}
      splitterSize={8}
      initialSize={prefs.secondaryPanelHeight}
      onResizeEnd={(num: number) => {
        prefs.secondaryPanelHeight = `${num}px`;
      }}
      minSize={showVideo ? "100px" : "0"}
      maxSize={showVideo ? "80%" : "0"}
      vert={false}
      startPanel={showVideo && <Video />}
      endPanel={<SecondaryToolbox />}
      endPanelControl={false}
    />
  );
};

export default function Viewer(props: ViewerProps) {
  return props.vertical ? Vertical(props) : Horizontal(props);
}
