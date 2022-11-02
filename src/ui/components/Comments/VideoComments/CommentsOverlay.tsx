import React from "react";
import { ConnectedProps, connect } from "react-redux";

import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
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
}: PropsFromRedux & { children: React.ReactNode }) {
  const recordingId = hooks.useGetRecordingId();
  const { comments: allComments } = hooks.useGetComments(recordingId);

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
      <div className="canvas-comments">
        {commentsAtTime.map(comment => (
          <VideoComment comment={comment} key={comment.id} />
        ))}
      </div>
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
