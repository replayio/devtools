import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { installObserver, refreshGraphics, Video as VideoPlayer } from "../../protocol/graphics";
import { selectors } from "../reducers";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";
import { UIState } from "ui/state";
import CanvasOverlay from "./Comments/VideoComments/CanvasOverlay";

function StalledOverlay({ isPlaybackStalled }: { isPlaybackStalled: boolean }) {
  return (
    <CanvasOverlay>
      {isPlaybackStalled ? (
        <div className="w-full h-full pointer-events-none bg-black opacity-50 absolute z-10" />
      ) : null}
    </CanvasOverlay>
  );
}

function Video({
  currentTime,
  playback,
  isNodePickerActive,
  pendingComment,
  setVideoNode,
  canvas,
  isPlaybackStalled,
  videoUrl,
}: PropsFromRedux) {
  useEffect(() => {
    installObserver();
  }, []);

  // Seek and resume playback if playing when swapping between Viewer and DevTools
  useEffect(() => {
    if (playback) {
      refreshGraphics();
      VideoPlayer.seek(currentTime);
      VideoPlayer.play();
    }
  }, []);

  // This is intentionally mousedown. Otherwise, the NodePicker's mouseup callback fires
  // first. This updates the isNodePickerActive value and makes it look like the node picker is
  // inactive when we check it here.
  const onMouseDown = () => {
    if (isNodePickerActive || pendingComment) {
      return;
    }
  };

  return (
    <div id="video">
      <video id="graphicsVideo" src={videoUrl || undefined} ref={setVideoNode} />
      <canvas id="graphics" onMouseDown={onMouseDown} />
      {canvas ? (
        <>
          <StalledOverlay isPlaybackStalled={isPlaybackStalled} />
          <CommentsOverlay />
        </>
      ) : null}
      <div id="highlighter-root"></div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
    isNodePickerActive: selectors.getIsNodePickerActive(state),
    currentTime: selectors.getCurrentTime(state),
    playback: selectors.getPlayback(state),
    recordingTarget: selectors.getRecordingTarget(state),
    videoUrl: selectors.getVideoUrl(state),
    isPlaybackStalled: selectors.isPlaybackStalled(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    setVideoNode: actions.setVideoNode,
    togglePlayback: actions.togglePlayback,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Video);
