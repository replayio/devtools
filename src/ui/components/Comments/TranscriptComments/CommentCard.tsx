import React, { useEffect, useState } from "react";
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

import differenceInMinutes from "date-fns/differenceInMinutes";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import differenceInWeeks from "date-fns/differenceInWeeks";
import differenceInMonths from "date-fns/differenceInMonths";
import differenceInYears from "date-fns/differenceInYears";

import { AvatarImage } from "ui/components/Avatar";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { trackEvent } from "ui/utils/telemetry";
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
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "Now";
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

  if (!comment.user) {
    return null;
  }

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
  comment,
  pendingComment,
  type,
}: {
  comment: Comment | Reply;
  pendingComment: PendingComment | null;
  type: "comment" | "reply";
}) {
  const isEditing = Boolean(pendingComment?.comment?.id == comment.id);
  const showOptions = !isEditing;

  return (
    <div className="space-y-1.5 group">
      <CommentItemHeader {...{ comment, showOptions }} />
      <ExistingCommentEditor
        comment={comment}
        type={type}
        editable={pendingComment?.comment.id === comment.id}
      />
    </div>
  );
}

type PropsFromParent = {
  comment: PendingNewComment;
  comments: PendingNewComment[];
};
type CommentCardProps = PropsFromRedux & PropsFromParent;

export const FocusContext = React.createContext({
  autofocus: false,
  isFocused: false,
  blur: () => {},
  close: () => {},
});

function CommentCard({
  comment,
  comments,
  currentTime,
  executionPoint,
  hoveredComment,
  pendingComment,
  seekToComment,
  setHoveredComment,
}: CommentCardProps) {
  const isPaused = currentTime === comment.time && executionPoint === comment.point;

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  if (comment.id === PENDING_COMMENT_ID) {
    return (
      <div
        className={`mx-auto w-full group border-b border-gray-300 cursor-pointer transition bg-gray-50`}
        onMouseEnter={() => setHoveredComment("pendingCommentId")}
        onMouseLeave={() => setHoveredComment(null)}
        onClick={() => {
          trackEvent("comments.focus");
          setIsFocused(true);
        }}
      >
        <div className={classNames("py-2.5 w-full border-l-2 border-secondaryAccent")}>
          <div className={classNames("px-2.5 pl-2 space-y-2")}>
            {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
            <FocusContext.Provider
              value={{
                autofocus: true,
                isFocused,
                blur: () => setIsFocused(false),
                close: () => setIsEditorOpen(false),
              }}
            >
              <NewCommentEditor comment={comment} type={"new_comment"} />
            </FocusContext.Provider>
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
      onClick={() => {
        seekToComment(comment);
        setIsEditorOpen(true);
        setIsFocused(true);
      }}
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
        <CommentItem type="comment" comment={comment as Comment} pendingComment={pendingComment} />
        {comment.replies?.map((reply: Reply) => (
          <div key={reply.id}>
            <CommentItem type="reply" comment={reply} pendingComment={pendingComment} />
          </div>
        ))}
        {isEditorOpen && (
          <FocusContext.Provider
            value={{
              autofocus: isFocused,
              isFocused,
              blur: () => setIsFocused(false),
              close: () => setIsEditorOpen(false),
            }}
          >
            <NewCommentEditor
              key={`${comment.id}-${(comment.replies || []).length}`}
              comment={{ ...comment, content: "", parentId: comment.id }}
              type={"new_reply"}
            />
          </FocusContext.Provider>
        )}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    executionPoint: getExecutionPoint(state),
    hoveredComment: selectors.getHoveredComment(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    editItem: actions.editItem,
    seekToComment: actions.seekToComment,
    setHoveredComment: actions.setHoveredComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCard);
