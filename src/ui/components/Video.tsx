import { installObserver, refreshGraphics } from "protocol/graphics";
import React, { FC, useEffect, useRef } from "react";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";

import { selectors } from "../reducers";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";
import CommentTool from "ui/components/shared/CommentTool";
import hooks from "ui/hooks";
import { UIState } from "ui/state";
import ReplayLogo from "./shared/ReplayLogo";
import Spinner from "./shared/Spinner";
import MaterialIcon from "./shared/MaterialIcon";
import { setShowVideoPanel } from "ui/actions/layout";
import { getViewMode } from "ui/reducers/layout";
import Tooltip from "./shared/Tooltip";

const HideVideoButton: FC = () => {
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(setShowVideoPanel(false));
  };

  return (
    <button
      className="absolute top-0 right-0 flex rounded-full bg-tabBgcolor p-1"
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
  isNodePickerInitializing,
  pendingComment,
  recordingTarget,
  stalled,
  mouseTargetsLoading,
  videoUrl,
}: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const viewMode = useSelector(getViewMode);
  const isPaused = !playback;
  const isNodeTarget = recordingTarget == "node";

  useEffect(() => {
    installObserver();
  }, []);

  // Seek and resume playback if playing when swapping between Viewer and DevTools
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

  // This is intentionally mousedown. Otherwise, the NodePicker's mouseup callback fires
  // first. This updates the isNodePickerActive value and makes it look like the node picker is
  // inactive when we check it here.
  const onMouseDown = () => {
    if (isNodePickerActive || isNodePickerInitializing || pendingComment) {
      return;
    }
  };

  const showCommentTool =
    isPaused && !isNodeTarget && !isNodePickerActive && !isNodePickerInitializing;
  return (
    <div id="video" className="relative bg-toolbarBackground">
      <div className="absolute flex h-full w-full items-center justify-center bg-chrome">
        <ReplayLogo size="sm" color="gray" />
      </div>

      <video id="graphicsVideo" src={videoUrl || undefined} />
      <canvas id="graphics" onMouseDown={onMouseDown} />
      {showCommentTool ? (
        <CommentsOverlay>
          <CommentLoader recordingId={recordingId} />
          {((isNodePickerActive && mouseTargetsLoading) || stalled) && (
            <div className="absolute bottom-5 right-5 z-20 flex opacity-50">
              <Spinner className="w-4 animate-spin" />
            </div>
          )}
        </CommentsOverlay>
      ) : null}
      {isNodePickerInitializing ? <Tooltip label="Loading…" targetID="video" /> : null}
      <div id="highlighter-root"></div>
      {viewMode === "dev" ? <HideVideoButton /> : null}
    </div>
  );
}

const connector = connect((state: UIState) => ({
  pendingComment: selectors.getPendingComment(state),
  isNodePickerActive: selectors.getIsNodePickerActive(state),
  isNodePickerInitializing: selectors.getIsNodePickerInitializing(state),
  currentTime: selectors.getCurrentTime(state),
  playback: selectors.getPlayback(state),
  recordingTarget: selectors.getRecordingTarget(state),
  videoUrl: selectors.getVideoUrl(state),
  stalled: selectors.isPlaybackStalled(state),
  mouseTargetsLoading: selectors.areMouseTargetsLoading(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Video);
