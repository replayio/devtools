import { getSourcemapVisualizerURL } from "devtools/client/debugger/src/utils/sourceVisualizations";
import React from "react";
import Icon from "ui/components/shared/Icon";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import { getAlternateSource } from "../../reducers/pause";
import { getSelectedSourceWithContent } from "../../reducers/sources";

export default function SourcemapVisualizerLink() {
  const selectedSource = useAppSelector(getSelectedSourceWithContent);
  const alternateSource = useAppSelector(getAlternateSource);
  if (!selectedSource) {
    return null;
  }

  // @ts-ignore possible undefined mismatch
  const href = getSourcemapVisualizerURL(selectedSource, alternateSource);
  if (!href) {
    return null;
  }

  return (
    <div className=" flex items-center pl-2">
      <a
        className="hover:underline"
        target="_blank"
        rel="noreferrer noopener"
        href={href}
        onClick={() => trackEvent("editor.open_sourcemap_visualizer")}
      >
        <Icon
          size="small"
          filename="external"
          className="cursor-pointer bg-iconColor group-hover:bg-primaryAccent"
        />{" "}
      </a>
    </div>
  );
}
