import {} from "devtools/client/inspector/markup/reducers/markup";
import { useEffect, useRef } from "react";
import { ConnectedProps, connect } from "react-redux";

import { CypressToggler } from "devtools/client/debugger/src/components/TestInfo/CypressToggler";
import { PreviewNodeHighlighter } from "devtools/client/inspector/markup/components/PreviewNodeHighlighter";
import { getHighlightedNodesLoading } from "devtools/client/inspector/markup/selectors/markup";
import { installObserver, refreshGraphics } from "protocol/graphics";
import CommentsOverlay from "ui/components/Comments/VideoComments/index";
import CommentTool from "ui/components/shared/CommentTool";
import hooks from "ui/hooks";
import { getSelectedPrimaryPanel, getViewMode } from "ui/reducers/layout";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";

import { selectors } from "../reducers";
import ReplayLogo from "./shared/ReplayLogo";
import Spinner from "./shared/Spinner";
import Tooltip from "./shared/Tooltip";

function CommentLoader({ recordingId }: { recordingId: string }) {
  const { comments, loading } = hooks.useGetComments(recordingId);

  if (loading) {
    return null;
  }

  return <CommentTool comments={comments} />;
}

function Video({
  playback,
  isNodePickerActive,
  isNodePickerInitializing,
  recordingTarget,
  stalled,
  mouseTargetsLoading,
  videoUrl,
  highlightedNodesLoading,
}: PropsFromRedux) {
  const recordingId = hooks.useGetRecordingId();
  const viewMode = useAppSelector(getViewMode);
  const panel = useAppSelector(getSelectedPrimaryPanel);
  const highlightedNodeIds = useAppSelector(state => state.markup.highlightedNodes);
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
    if (isNodePickerActive || isNodePickerInitializing) {
      return;
    }
  };

  const showCommentTool =
    isPaused && !isNodeTarget && !isNodePickerActive && !isNodePickerInitializing;
  const showSpinner =
    highlightedNodesLoading || (isNodePickerActive && mouseTargetsLoading) || stalled;

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
          {showSpinner && (
            <div className="absolute bottom-5 right-5 z-20 flex opacity-50">
              <Spinner className="w-4 animate-spin" />
            </div>
          )}
        </CommentsOverlay>
      ) : null}
      {isNodePickerInitializing ? <Tooltip label="Loading…" targetID="video" /> : null}
      {panel === "cypress" && <CypressToggler />}
      <div id="highlighter-root">
        {highlightedNodeIds?.map(nodeId => (
          <PreviewNodeHighlighter key={nodeId} nodeId={nodeId} />
        ))}
      </div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  isNodePickerActive: selectors.getIsNodePickerActive(state),
  isNodePickerInitializing: selectors.getIsNodePickerInitializing(state),
  currentTime: selectors.getCurrentTime(state),
  playback: selectors.getPlayback(state),
  recordingTarget: selectors.getRecordingTarget(state),
  videoUrl: selectors.getVideoUrl(state),
  stalled: selectors.isPlaybackStalled(state),
  mouseTargetsLoading: selectors.getAreMouseTargetsLoading(state),
  highlightedNodesLoading: getHighlightedNodesLoading(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Video);
