import React from "react";
import { connect, ConnectedProps } from "react-redux";
import classNames from "classnames";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import NewCommentEditor from "./CommentEditor/NewCommentEditor";
import { Comment, PendingComment, PendingNewComment, Reply } from "ui/state/comments";
import ExistingCommentEditor from "./CommentEditor/ExistingCommentEditor";
import CommentActions from "./CommentActions";
import CommentSource from "./CommentSource";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import useAuth0 from "ui/utils/useAuth0";
import CommentCardFooter from "./CommentCardFooter";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

const hoveredStyles = "shadow-xl border-blue-600 hover:border-blue-600";

function CommentItem({
  pendingComment,
  comment,
}: {
  pendingComment: PendingComment | null;
  comment: Comment | Reply;
}) {
  if (
    pendingComment &&
    (pendingComment.type == "edit_reply" || pendingComment.type == "edit_comment") &&
    "id" in comment &&
    pendingComment.comment.id == comment.id
  ) {
    return <ExistingCommentEditor comment={pendingComment.comment} type={pendingComment.type} />;
  }

  let relativeDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div>
      <div className="space-y-6 px-4 pt-4">
        <div className="flex space-x-3 items-center">
          <img
            className="h-10 w-10 rounded-full"
            src={comment.user.picture}
            alt={comment.user.name}
          />
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium overflow-hidden overflow-ellipsis whitespace-pre">
                {comment.user.name}
              </h3>
              <CommentActions comment={comment} isRoot={"replies" in comment} />
            </div>
            <p className="text-lg text-gray-500 overflow-hidden overflow-ellipsis whitespace-pre">
              {relativeDate}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6 px-4 pt-4 pb-4 text-lg">{comment.content}</div>
    </div>
  );
}

type PropsFromParent = {
  comment: Comment | PendingNewComment;
};
type CommentCardProps = PropsFromRedux & PropsFromParent;

function CommentCard({
  comment,
  currentTime,
  executionPoint,
  seekToComment,
  setModal,
  replyToComment,
  hoveredComment,
  setHoveredComment,
  pendingComment,
}: CommentCardProps) {
  const { isAuthenticated } = useAuth0();
  const isPaused = comment.time === currentTime && executionPoint === comment.point;
  const isEditing =
    pendingComment &&
    ["edit_comment", "edit_reply"].includes(pendingComment.type) &&
    pendingComment?.comment.time === currentTime &&
    pendingComment?.comment.point === executionPoint;

  const onReply = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      setModal("login");
      return;
    }

    if ("id" in comment) {
      replyToComment(comment);
    }
  };

  // If the comment for this card doesn't have an ID, it's because it's the corresponding
  // comment for a pending new comment.
  if (!("id" in comment)) {
    return (
      <div
        className={`mx-auto w-full group`}
        onMouseEnter={() => setHoveredComment("pendingCommentId")}
        onMouseLeave={() => setHoveredComment(null)}
      >
        <div
          className={classNames("bg-white rounded-xl border border-blue-400 shadow-lg", {
            [hoveredStyles]: hoveredComment == "pendingCommentId" && isPaused,
          })}
        >
          {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
          <NewCommentEditor comment={comment} type={"new_comment"} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto w-full group`}
      onClick={() => seekToComment(comment)}
      onMouseEnter={() => setHoveredComment(comment.id)}
      onMouseLeave={() => setHoveredComment(null)}
    >
      <div
        className={classNames("bg-white rounded-xl border border-gray-300 hover:border-blue-400", {
          "border-blue-400 shadow-lg": isPaused,
          "cursor-pointer": !isPaused,
          [hoveredStyles]: hoveredComment == comment.id && isPaused,
        })}
      >
        {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
        <CommentItem comment={comment} pendingComment={pendingComment} />
        {comment.replies?.map((reply: Reply, i: number) => (
          <div className="border-t border-gray-200" key={"id" in reply ? reply.id : 0}>
            <CommentItem comment={reply} pendingComment={pendingComment} />
          </div>
        ))}
        {isPaused && !isEditing ? <CommentCardFooter comment={comment} onReply={onReply} /> : null}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
    hoveredComment: selectors.getHoveredComment(state),
  }),
  {
    replyToComment: actions.replyToComment,
    setModal: actions.setModal,
    seekToComment: actions.seekToComment,
    editItem: actions.editItem,
    setHoveredComment: actions.setHoveredComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCard);
