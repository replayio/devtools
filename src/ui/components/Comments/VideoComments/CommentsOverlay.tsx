import React from "react";
import { ConnectedProps, connect } from "react-redux";

import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { getHoveredCommentId, getSelectedCommentId } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { Comment } from "ui/state/comments";

import VideoComment from "./VideoComment";

function findComment({ comments, currentTime }: { comments: Comment[]; currentTime: number }) {
  return comments.filter(
    comment => comment && "position" in comment && comment.position && comment.time == currentTime
  );
}

function CommentsOverlay({
  canvas,
  currentTime,
  children,
  showComments,
}: PropsFromRedux & { children: React.ReactNode; showComments: boolean }) {
  const recordingId = hooks.useGetRecordingId();
  const { comments: allComments } = hooks.useGetComments(recordingId);

  const hoveredCommentId = useAppSelector(getHoveredCommentId);
  const selectedCommentId = useAppSelector(getSelectedCommentId);

  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale } = canvas;

  const commentsAtTime = findComment({ comments: allComments, currentTime });

  return (
    <div
      className="canvas-overlay"
      style={{
        top: top,
        left: left,
        width: width * scale - 2,
        height: height * scale - 2,
      }}
    >
      {showComments && (
        <div className="canvas-comments">
          {commentsAtTime.map(comment => {
            return (
              <VideoComment
                comment={comment}
                isHighlighted={hoveredCommentId === comment.id || selectedCommentId === comment.id}
                key={comment.id}
              />
            );
          })}
        </div>
      )}
      {children}
    </div>
  );
}

const connector = connect((state: UIState) => ({
  canvas: selectors.getCanvas(state),
  currentTime: selectors.getCurrentTime(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentsOverlay);
