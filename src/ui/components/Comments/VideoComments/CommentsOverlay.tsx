import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import VideoComment from "./VideoComment";
import "./CommentsOverlay.css";
import { UIState } from "ui/state";
import { Comment, PendingComment } from "ui/state/comments";
import CommentTool from "ui/components/shared/CommentTool";
import CanvasOverlay from "./CanvasOverlay";
import useAuth0 from "ui/utils/useAuth0";

function findComment({
  hasuraComments,
  pendingComment,
  currentTime,
}: {
  hasuraComments: Comment[];
  pendingComment: PendingComment | null;
  currentTime: number;
}) {
  let comments: (Comment | PendingComment["comment"])[] = [...hasuraComments];

  // We replace the hasuraComment that's currently being edited with our own
  // pendingComment. This lets us update the pendingComment as the user
  // move the location marker around the video and have it visually update
  // the displayed comments.
  if (pendingComment) {
    comments = hasuraComments.filter(
      comment => !("id" in pendingComment?.comment) || pendingComment?.comment.id != comment.id
    );
    comments.push(pendingComment.comment);
  }

  // Find the comment at the current position
  return comments.filter(
    comment => comment && "position" in comment && comment.position && comment.time == currentTime
  );
}

function CommentLoader({ recordingId }: { recordingId: string }) {
  const { comments, loading } = hooks.useGetComments(recordingId);

  if (loading) {
    return null;
  }

  return <CommentTool comments={comments} />;
}

function CommentsOverlay({
  pendingComment,
  currentTime,
  playback,
  recordingTarget,
  isNodePickerActive,
}: PropsFromRedux) {
  const { isAuthenticated } = useAuth0();
  const isPaused = !playback;
  const recordingId = hooks.useGetRecordingId();
  const { comments: hasuraComments } = hooks.useGetComments(recordingId);

  const comments = findComment({ hasuraComments, pendingComment, currentTime });
  const isNodeTarget = recordingTarget == "node";

  const showComments = isPaused && !isNodeTarget && isAuthenticated && !isNodePickerActive;

  if (!showComments) {
    return <CanvasOverlay />;
  }

  return (
    <CanvasOverlay>
      <div className="canvas-comments">
        {comments.map(comment => (
          <VideoComment comment={comment} key={"id" in comment ? comment.id : "pendingCommentId"} />
        ))}
      </div>
      <CommentLoader recordingId={recordingId} />
    </CanvasOverlay>
  );
}

const connector = connect((state: UIState) => ({
  currentTime: selectors.getCurrentTime(state),
  pendingComment: selectors.getPendingComment(state),
  playback: selectors.getPlayback(state),
  recordingTarget: selectors.getRecordingTarget(state),
  isNodePickerActive: selectors.getIsNodePickerActive(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentsOverlay);
