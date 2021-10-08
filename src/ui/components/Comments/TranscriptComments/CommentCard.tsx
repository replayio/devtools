import React, { useEffect, useState } from "react";
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

import differenceInMinutes from "date-fns/differenceInMinutes";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import differenceInWeeks from "date-fns/differenceInWeeks";
import differenceInMonths from "date-fns/differenceInMonths";
import differenceInYears from "date-fns/differenceInYears";

import useAuth0 from "ui/utils/useAuth0";
import CommentCardFooter from "./CommentCardFooter";
import { AvatarImage } from "ui/components/Avatar";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

function formatRelativeTime(date: Date) {
  const minutes = differenceInMinutes(Date.now(), date);
  const days = differenceInCalendarDays(Date.now(), date);
  const weeks = differenceInWeeks(Date.now(), date);
  const months = differenceInMonths(Date.now(), date);
  const years = differenceInYears(Date.now(), date);

  if (years > 0) {
    return `${years}y`;
  }
  if (months > 0) {
    return `${months}m`;
  }

  if (weeks > 0) {
    return `${weeks}w`;
  }

  if (days > 0) {
    return `${days}d`;
  }

  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h`;
  }

  if (minutes == 0) {
    return "Now";
  }

  return `${minutes}m`;
}

function BorderBridge({
  comments,
  comment,
  isPaused,
}: {
  comments: (Comment | PendingNewComment)[];
  comment: Comment | PendingNewComment;
  isPaused: boolean;
}) {
  const currentIndex = comments.findIndex(c => c === comment);
  const nextComment = comments[currentIndex + 1];
  const hasNextCommentSibling =
    nextComment && comment.time === nextComment.time && comment.point === nextComment.point;

  if (!isPaused || !hasNextCommentSibling) {
    return null;
  }

  return <div className="absolute -bottom-px h-px w-0.5 bg-secondaryAccent mix-blend-multiply" />;
}

function CommentItemHeader({
  comment,
  showOptions,
}: {
  comment: Comment | Reply;
  showOptions: boolean;
}) {
  const [relativeDate, setRelativeDate] = useState("");

  useEffect(() => {
    setRelativeDate(formatRelativeTime(new Date(comment.createdAt)));
  }, []);

  return (
    <div className="flex flex-row space-x-1.5 items-center">
      <AvatarImage className="h-5 w-5 rounded-full avatar" src={comment.user.picture} />
      <div className="overflow-hidden flex flex-row flex-grow space-x-2">
        <span className="font-medium overflow-hidden overflow-ellipsis whitespace-pre">
          {comment.user.name}
        </span>
        <span
          className="overflow-hidden overflow-ellipsis whitespace-pre flex-shrink-0 opacity-50"
          title={relativeDate}
        >
          {relativeDate}
        </span>
      </div>
      {showOptions ? <CommentActions comment={comment} isRoot={"replies" in comment} /> : null}
    </div>
  );
}

function CommentItem({
  pendingComment,
  comment,
}: {
  pendingComment: PendingComment | null;
  comment: Comment | Reply;
}) {
  let content, showOptions;

  if (
    pendingComment &&
    (pendingComment.type == "edit_reply" || pendingComment.type == "edit_comment") &&
    "id" in comment &&
    pendingComment.comment.id == comment.id
  ) {
    const { comment, type } = pendingComment;

    content = <ExistingCommentEditor comment={comment} type={type} />;
    showOptions = false;
  } else {
    content = (
      <div className="space-y-4 text-xs break-words" style={{ lineHeight: "1.125rem" }}>
        <Markdown>{comment.content}</Markdown>
      </div>
    );
    showOptions = true;
  }

  return (
    <div className="space-y-1.5 group">
      <CommentItemHeader {...{ comment, showOptions }} />
      {content}
    </div>
  );
}

type PropsFromParent = {
  comment: Comment | PendingNewComment;
  comments: (Comment | PendingNewComment)[];
};
type CommentCardProps = PropsFromRedux & PropsFromParent;

function CommentCard({
  comment,
  comments,
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
        className={`mx-auto w-full group border-b border-gray-300 cursor-pointer transition bg-gray-50`}
        onMouseEnter={() => setHoveredComment("pendingCommentId")}
        onMouseLeave={() => setHoveredComment(null)}
      >
        <div className={classNames("py-2.5 w-full border-l-2 border-secondaryAccent")}>
          <div className={classNames("px-2.5 pl-2 space-y-2")}>
            {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
            <NewCommentEditor comment={comment} type={"new_comment"} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames(
        `mx-auto relative w-full border-b border-gray-300 cursor-pointer transition`,
        hoveredComment === comment.id ? "bg-toolbarBackground" : "bg-white"
      )}
      onClick={() => seekToComment(comment)}
      onMouseEnter={() => setHoveredComment(comment.id)}
      onMouseLeave={() => setHoveredComment(null)}
    >
      <BorderBridge {...{ comments, comment, isPaused }} />
      <div
        className={classNames("py-2.5 w-full border-l-2 border-transparent px-2.5 pl-2 space-y-2", {
          "border-secondaryAccent": isPaused,
        })}
      >
        {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
        <CommentItem comment={comment} pendingComment={pendingComment} />
        {comment.replies?.map((reply: Reply, i: number) => (
          <div key={"id" in reply ? reply.id : 0}>
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
