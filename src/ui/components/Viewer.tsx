import React from "react";
import SecondaryToolbox from "./SecondaryToolbox";
import SplitBox from "devtools-splitter";
import { prefs } from "ui/utils/prefs";
import Video from "ui/components/Video";

export default function Viewer() {
  return (
    <SplitBox
      style={{ width: "100%", overflow: "hidden" }}
      splitterSize={1}
      initialSize={prefs.secondaryPanelHeight}
      onResizeEnd={(num: number) => {
        prefs.secondaryPanelHeight = num;
      }}
      minSize="20%"
      maxSize="80%"
      vert={false}
      startPanel={<Video />}
      endPanel={<SecondaryToolbox />}
      endPanelControl={false}
    />
  );
}
