import React, { useContext } from "react";

import { useSourcesById } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import Icon from "ui/components/shared/Icon";
import { getRecordingId } from "ui/reducers/app";
import { getSelectedSourceId } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import { getSelectedFrameId } from "../../reducers/pause";
import {
  CursorPosition,
  getSourcemapVisualizerURLSuspense,
} from "../../utils/sourceVisualizations";

export default function SourcemapVisualizerLinkSuspends({
  cursorPosition,
}: {
  cursorPosition: CursorPosition;
}) {
  const client = useContext(ReplayClientContext);
  const recordingId = useAppSelector(getRecordingId);
  const selectedSourceId = useAppSelector(getSelectedSourceId);
  const sourcesById = useSourcesById(client);
  const selectedSource = selectedSourceId ? sourcesById.get(selectedSourceId) : undefined;
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const sourcesState = useAppSelector(state => state.sources);
  const visualizerURL = getSourcemapVisualizerURLSuspense(
    client,
    recordingId,
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
          className="mr-1 cursor-pointer bg-iconColor group-hover:bg-primaryAccent"
        />
        Show Source Map
      </a>
    </div>
  );
}
