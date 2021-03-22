import React, { useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { Comment } from "ui/state/comments";
import CommentItem from "./CommentItem";
import "./CommentThread.css";

type CommentThreadProps = PropsFromRedux & {
  collaborators: any;
  comment?: Comment | null;
  time: number;
};

function CommentThread({
  collaborators,
  comment,
  time,
  currentTime,
  pendingComment,
  hoveredComment,
  seek,
  setHoveredComment,
  clearPendingComment,
}: CommentThreadProps) {
  const commentEl = useRef<HTMLDivElement>(null);

  const seekToComment = (e: React.MouseEvent) => {
    if (!comment) {
      return;
    }

    const { point, time, has_frames } = comment;
    e.stopPropagation();
    clearPendingComment();

    return seek(point, time, has_frames);
  };
  const updatedHoveredComment = () => {
    if (!comment || !("id" in comment)) {
      return;
    }
    setHoveredComment(comment.id);
  };

  useEffect(
    function scrollThreadIntoView() {
      if (commentEl.current && time === currentTime) {
        commentEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [currentTime, pendingComment]
  );

  return (
    <div className={classnames("comment-container")} ref={commentEl}>
      {
        <div
          className="comment"
          onClick={seekToComment}
          onMouseEnter={updatedHoveredComment}
          onMouseLeave={() => setHoveredComment(null)}
        >
          <div className="comment-body">
            {comment && (
              <CommentItem {...{ comment, collaborators, hoveredComment, isRoot: true }} />
            )}
            {comment &&
              "replies" in comment &&
              comment.replies.map(reply => (
                <CommentItem
                  collaborators={collaborators}
                  comment={reply}
                  key={reply.id}
                  isRoot={false}
                />
              ))}
            {pendingComment &&
            pendingComment.comment.time == time &&
            pendingComment.type.includes("new") ? (
              <CommentItem
                {...{
                  collaborators,
                  comment: pendingComment.comment,
                  type: pendingComment.type,
                  isRoot: pendingComment?.type == "new_comment",
                }}
              />
            ) : null}
          </div>
        </div>
      }
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
    currentTime: selectors.getCurrentTime(state),
    hoveredComment: selectors.getHoveredComment(state),
  }),
  {
    seek: actions.seek,
    setHoveredComment: actions.setHoveredComment,
    clearPendingComment: actions.clearPendingComment,
    setPendingComment: actions.setPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentThread);
