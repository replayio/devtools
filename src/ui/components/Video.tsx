import React, { FC, useEffect } from "react";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";
import { actions } from "ui/actions";
import { installObserver, refreshGraphics, Video as VideoPlayer } from "../../protocol/graphics";
import { selectors } from "../reducers";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";
import CommentTool from "ui/components/shared/CommentTool";
import hooks from "ui/hooks";
import { UIState } from "ui/state";
import ReplayLogo from "./shared/ReplayLogo";
import Spinner from "./shared/Spinner";
import MaterialIcon from "./shared/MaterialIcon";
import { setShowVideoPanel } from "ui/actions/layout";

const HideVideoButton: FC = () => {
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(setShowVideoPanel(false));
  };

  return (
    <button
      className="absolute top-0 right-0 flex bg-themeTabBgcolor rounded-full p-1"
      title="Hide Video"
      onClick={onClick}
    >
      <MaterialIcon>videocam_off</MaterialIcon>
    </button>
  );
};

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
  stalled,
  mouseTargetsLoading,
  videoUrl,
}: PropsFromRedux) {
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
    <div id="video" className="relative bg-toolbarBackground">
      <div className="absolute flex h-full w-full items-center justify-center bg-chrome">
        <ReplayLogo size="sm" color="gray" />
      </div>

      <video id="graphicsVideo" src={videoUrl || undefined} ref={setVideoNode} />
      <canvas id="graphics" onMouseDown={onMouseDown} />
      {showCommentTool ? (
        <CommentsOverlay>
          <CommentLoader recordingId={recordingId} />
          {(mouseTargetsLoading || stalled) && (
            <div className="absolute bottom-5 right-5 z-20 flex opacity-50">
              <Spinner className="w-4 animate-spin" />
            </div>
          )}
        </CommentsOverlay>
      ) : null}
      <div id="highlighter-root"></div>
      <HideVideoButton />
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
    stalled: selectors.isPlaybackStalled(state),
    mouseTargetsLoading: selectors.areMouseTargetsLoading(state),
  }),
  {
    setVideoNode: actions.setVideoNode,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Video);
