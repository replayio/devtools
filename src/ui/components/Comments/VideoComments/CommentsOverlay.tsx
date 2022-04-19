import React from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { Comment, PendingComment } from "ui/state/comments";

import VideoComment from "./VideoComment";

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

function CommentsOverlay({
  pendingComment,
  canvas,
  currentTime,
  children,
}: PropsFromRedux & { children: React.ReactNode }) {
  const recordingId = hooks.useGetRecordingId();
  const { comments: hasuraComments } = hooks.useGetComments(recordingId);

  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale } = canvas;
  const comments = findComment({ currentTime, hasuraComments, pendingComment });

  return (
    <div
      className="canvas-overlay"
      style={{
        height: height * scale - 2,
        left: left,
        top: top,
        width: width * scale - 2,
      }}
    >
      <div className="canvas-comments">
        {comments.map(comment => (
          <VideoComment comment={comment} key={"id" in comment ? comment.id : "pendingCommentId"} />
        ))}
      </div>
      {children}
    </div>
  );
}

const connector = connect((state: UIState) => ({
  canvas: selectors.getCanvas(state),
  currentTime: selectors.getCurrentTime(state),
  pendingComment: selectors.getPendingComment(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentsOverlay);
