import React, { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import Icon from "ui/components/shared/Icon";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";
import { getPauseId, getSelectedFrameId } from "../../reducers/pause";
import { getSelectedSource } from "ui/reducers/sources";
import { getSourcemapVisualizerURLSuspense } from "../../utils/sourceVisualizations";
import { CursorPosition } from "./Footer";

export default function SourcemapVisualizerLink({
  cursorPosition,
}: {
  cursorPosition: CursorPosition;
}) {
  const client = useContext(ReplayClientContext);
  const pauseId = useAppSelector(getPauseId);
  const selectedSource = useAppSelector(getSelectedSource);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const sourcesState = useAppSelector(state => state.sources);
  if (!pauseId) {
    return null;
  }
  const visualizerURL = getSourcemapVisualizerURLSuspense(
    pauseId,
    selectedSource,
    selectedFrameId,
    sourcesState,
    cursorPosition,
    client
  );
  if (!visualizerURL) {
    return null;
  }

  return (
    <div className=" flex items-center pl-2">
      <a
        className="hover:underline"
        target="_blank"
        rel="noreferrer noopener"
        href={visualizerURL}
        onClick={() => trackEvent("editor.open_sourcemap_visualizer")}
      >
        <Icon
          size="small"
          filename="external"
          className="cursor-pointer bg-iconColor group-hover:bg-primaryAccent mr-1"
        />
        Show Source Map
      </a>
    </div>
  );
}
