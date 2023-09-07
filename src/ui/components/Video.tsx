import { useEffect, useRef, useState } from "react";

import { PreviewNodeHighlighter } from "devtools/client/inspector/markup/components/PreviewNodeHighlighter";
import { installObserver, refreshGraphics } from "protocol/graphics";
import Spinner from "replay-next/components/Spinner";
import {
  getAreMouseTargetsLoading,
  getIsNodePickerActive,
  getIsNodePickerInitializing,
  getRecordingTarget,
  getVideoUrl,
} from "ui/actions/app";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";
import ToggleButton from "ui/components/TestSuite/views/Toggle/ToggleButton";
import useVideoContextMenu from "ui/components/useVideoContextMenu";
import { getSelectedPrimaryPanel } from "ui/reducers/layout";
import { getPlayback, isPlaybackStalled } from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

import ReplayLogo from "./shared/ReplayLogo";
import Tooltip from "./shared/Tooltip";

export default function Video() {
  const panel = useAppSelector(getSelectedPrimaryPanel);
  const highlightedNodeIds = useAppSelector(state => state.markup.highlightedNodes);
  const isNodePickerActive = useAppSelector(getIsNodePickerActive);
  const isNodePickerInitializing = useAppSelector(getIsNodePickerInitializing);
  const playback = useAppSelector(getPlayback);
  const recordingTarget = useAppSelector(getRecordingTarget);
  const videoUrl = useAppSelector(getVideoUrl);
  const stalled = useAppSelector(isPlaybackStalled);
  const mouseTargetsLoading = useAppSelector(getAreMouseTargetsLoading);

  const isPaused = !playback;
  const isNodeTarget = recordingTarget == "node";

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { contextMenu, onContextMenu } = useVideoContextMenu({ canvasRef });

  const [showDelayedSpinner, setShowDelayedSpinner] = useState(false);

  useEffect(() => {
    if ((isNodePickerActive && mouseTargetsLoading) || stalled) {
      const timerId = setTimeout(() => {
        setShowDelayedSpinner(true);
      }, 700);
      return () => {
        clearTimeout(timerId);
      };
    } else {
      setShowDelayedSpinner(false);
    }
  }, [isNodePickerActive, mouseTargetsLoading, stalled]);

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
    if (isNodePickerActive || isNodePickerInitializing) {
      return;
    }

    onContextMenu(e);
  };

  const showCommentTool =
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
      {showCommentTool ? (
        <CommentsOverlay>
          {showDelayedSpinner && (
            <div className="absolute bottom-5 right-5 z-20 flex opacity-100">
              <Spinner className="w-5 animate-spin text-black" />
            </div>
          )}
        </CommentsOverlay>
      ) : null}
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
