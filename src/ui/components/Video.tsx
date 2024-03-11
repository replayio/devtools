import { useContext, useEffect, useRef } from "react";

import { PreviewNodeHighlighter } from "devtools/client/inspector/markup/components/PreviewNodeHighlighter";
import { installObserver, refreshGraphics } from "protocol/graphics";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import {
  getIsNodePickerActive,
  getIsNodePickerInitializing,
  getRecordingTarget,
  getVideoUrl,
} from "ui/actions/app";
import { stopPlayback } from "ui/actions/timeline";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";
import ToggleButton from "ui/components/TestSuite/views/Toggle/ToggleButton";
import useVideoContextMenu from "ui/components/useVideoContextMenu";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { getPlayback, isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import ReplayLogo from "./shared/ReplayLogo";
import Tooltip from "./shared/Tooltip";

export default function Video() {
  const { accessToken } = useContext(SessionContext);

  const dispatch = useAppDispatch();

  const panel = useAppSelector(getSelectedPrimaryPanel);
  const highlightedNodeIds = useAppSelector(state => state.markup.highlightedNodes);
  const isNodePickerActive = useAppSelector(getIsNodePickerActive);
  const isNodePickerInitializing = useAppSelector(getIsNodePickerInitializing);
  const playback = useAppSelector(getPlayback);
  const recordingTarget = useAppSelector(getRecordingTarget);
  const videoUrl = useAppSelector(getVideoUrl);
  const isPlaying = useAppSelector(isPlayingSelector);

  const isPaused = !playback;
  const isNodeTarget = recordingTarget == "node";

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { addComment, contextMenu, onContextMenu } = useVideoContextMenu({ canvasRef });

  useEffect(() => {
    installObserver();
  }, []);

  const didSeekOnMountRef = useRef(false);
  useEffect(() => {
    if (didSeekOnMountRef.current) {
      return;
    }

    didSeekOnMountRef.current = true;

    if (playback) {
      refreshGraphics();
    }

    return () => {
      didSeekOnMountRef.current = false;
    };
  });

  const onMouseDown = () => {
    if (isNodePickerActive || isNodePickerInitializing) {
      return;
    }
  };

  const onClick = (e: React.MouseEvent) => {
    if (isPlaying) {
      dispatch(stopPlayback());
    }

    if (isNodePickerActive || isNodePickerInitializing || accessToken == null) {
      return;
    }

    addComment(e);
  };

  const showComments =
    isPaused && !isNodeTarget && !isNodePickerActive && !isNodePickerInitializing;

  return (
    <div id="video" className="relative bg-toolbarBackground">
      <div className="absolute flex h-full w-full items-center justify-center bg-chrome">
        <ReplayLogo size="sm" color="gray" />
      </div>

      <video id="graphicsVideo" src={videoUrl || undefined} />
      <canvas
        id="graphics"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseDown={onMouseDown}
        ref={canvasRef}
      />
      {contextMenu}
      <CommentsOverlay showComments={showComments} />
      {isNodePickerInitializing ? <Tooltip label="Loading…" targetID="video" /> : null}
      {panel === "cypress" && <ToggleButton />}
      <div id="highlighter-root">
        {highlightedNodeIds?.map(nodeId => (
          <PreviewNodeHighlighter key={nodeId} nodeId={nodeId} />
        ))}
      </div>
    </div>
  );
}
