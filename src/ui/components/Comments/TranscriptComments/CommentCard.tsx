import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import classNames from "classnames";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import NewCommentEditor from "./CommentEditor/NewCommentEditor";
import {
  Comment,
  PendingComment,
  PendingNewComment,
  PendingNewReply,
  Reply,
} from "ui/state/comments";
import ExistingCommentEditor from "./CommentEditor/ExistingCommentEditor";
import CommentActions from "./CommentActions";
import CommentSource from "./CommentSource";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import useAuth0 from "ui/utils/useAuth0";
import { setModal } from "ui/actions/app";
import useDraftJS from "./CommentEditor/use-draftjs";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

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
  pendingComment,
}: CommentCardProps) {
  const { isAuthenticated } = useAuth0();
  const load = useDraftJS();
  const isPaused = comment.time === currentTime && executionPoint === comment.point;
  const isEditing =
    pendingComment &&
    ["edit_comment", "edit_reply"].includes(pendingComment.type) &&
    pendingComment?.comment.time === currentTime &&
    pendingComment?.comment.point === executionPoint;

  useEffect(() => {
    let idle: NodeJS.Timeout | undefined = setTimeout(() => {
      load().then(() => {
        idle = undefined;
      });
    }, 1000);

    return () => idle && clearTimeout(idle);
  }, []);

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
      <div className={`mx-auto w-full group`}>
        <div className={classNames("bg-white rounded-xl border border-blue-400 shadow-lg")}>
          {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
          <NewCommentEditor comment={comment} type={"new_comment"} />
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full group`} onClick={() => seekToComment(comment)}>
      <div
        className={classNames("bg-white rounded-xl border border-gray-300 hover:border-blue-400", {
          "border-blue-400 shadow-lg": isPaused,
          "cursor-pointer": !isPaused,
        })}
      >
        {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
        <CommentItem comment={comment} pendingComment={pendingComment} />
        {comment.replies?.map((reply: Reply, i: number) => (
          <div className="border-t border-gray-200" key={"id" in reply ? reply.id : 0}>
            <CommentItem comment={reply} pendingComment={pendingComment} />
          </div>
        ))}
        {isPaused && !isEditing ? (
          pendingComment && pendingComment.type.includes("new") ? (
            <div className="border-t border-gray-200">
              <NewCommentEditor
                comment={pendingComment.comment as PendingNewReply}
                type={"new_reply"}
              />
            </div>
          ) : (
            <div
              className="mt-6 border-t border-gray-200 px-4 py-4 text-lg text-gray-400"
              onClick={onReply}
            >
              Write a reply...
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
  }),
  {
    replyToComment: actions.replyToComment,
    setModal: actions.setModal,
    seekToComment: actions.seekToComment,
    editItem: actions.editItem,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCard);
