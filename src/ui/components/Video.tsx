import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { installObserver, refreshGraphics, Video as VideoPlayer } from "../../protocol/graphics";
import { selectors } from "../reducers";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";
import CommentTool from "ui/components/shared/CommentTool";
import hooks from "ui/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { UIState } from "ui/state";
import ReplayLogo from "./shared/ReplayLogo";

function CommentLoader({ recordingId }: { recordingId: string }) {
  const { comments, loading } = hooks.useGetComments(recordingId);

  if (loading) {
    return null;
  }

  return <CommentTool comments={comments} />;
}

function Video({
  currentTime,
  playback,
  isNodePickerActive,
  pendingComment,
  recordingTarget,
  setVideoNode,
  videoUrl,
}: PropsFromRedux) {
  const { isAuthenticated } = useAuth0();
  const recordingId = hooks.useGetRecordingId();
  const isPaused = !playback;
  const isNodeTarget = recordingTarget == "node";

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

  const showCommentTool = isPaused && !isNodeTarget && !isNodePickerActive;

  return (
    <div id="video" className="" style={{ background: "var(--theme-toolbar-background)" }}>
      <div className="absolute w-full h-full flex items-center justify-center">
        <ReplayLogo size="sm" color="gray" />
      </div>
      <video id="graphicsVideo" src={videoUrl || undefined} ref={setVideoNode} />
      <canvas id="graphics" onMouseDown={onMouseDown} />
      {showCommentTool ? (
        <CommentsOverlay>
          <CommentLoader recordingId={recordingId} />
        </CommentsOverlay>
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
  }),
  {
    setVideoNode: actions.setVideoNode,
    togglePlayback: actions.togglePlayback,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Video);
