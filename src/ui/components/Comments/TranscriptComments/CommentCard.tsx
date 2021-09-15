import React from "react";
import { connect, ConnectedProps } from "react-redux";
import classNames from "classnames";
import Markdown from "react-markdown";
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
import { AvatarImage } from "ui/components/Avatar";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

const hoveredStyles = "border-secondaryAccent hover:border-secondaryAccent";

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
      <div className="space-y-4 px-3 pt-3">
        <div className="flex space-x-2.5 items-center">
          <AvatarImage className="h-8 w-8 rounded-full avatar" src={comment.user.picture} />
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-medium overflow-hidden overflow-ellipsis whitespace-pre">
                {comment.user.name}
              </h3>
              <CommentActions comment={comment} isRoot={"replies" in comment} />
            </div>
            <p className="text-gray-500 overflow-hidden overflow-ellipsis whitespace-pre">
              {relativeDate}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-3 pt-3 pb-3 text-xs break-words">
        <Markdown>{comment.content}</Markdown>
      </div>
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
          className={classNames("bg-white rounded-lg border border-primaryAccent shadow-sm", {
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
        className={classNames(
          "bg-white rounded-lg border border-gray-200 hover:border-primaryAccent",
          {
            "border-primaryAccent shadow-sm": isPaused,
            "cursor-pointer": !isPaused,
            [hoveredStyles]: hoveredComment == comment.id && isPaused,
          }
        )}
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
