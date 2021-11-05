import React, { useEffect, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import classNames from "classnames";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import NewCommentEditor from "./CommentEditor/NewCommentEditor";
import { Comment, PendingComment, Reply } from "ui/state/comments";
import ExistingCommentEditor from "./CommentEditor/ExistingCommentEditor";
import CommentActions from "./CommentActions";
import CommentSource from "./CommentSource";

import { AvatarImage } from "ui/components/Avatar";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { trackEvent } from "ui/utils/telemetry";
import { commentKeys, formatRelativeTime } from "ui/utils/comments";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

function BorderBridge({
  comments,
  comment,
  isPaused,
}: {
  comments: Comment[];
  comment: Comment;
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
  editItem,
  showOptions,
}: {
  comment: Comment | Reply;
  editItem: (comment: Comment | Reply) => void;
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
          className="overflow-hidden overflow-ellipsis whitespace-pre flex-shrink-0 text-gray-400"
          title={relativeDate}
        >
          {relativeDate}
        </span>
      </div>
      {/* {showOptions ? (
        <CommentActions comment={comment} editItem={editItem} isRoot={"replies" in comment} />
      ) : null} */}
    </div>
  );
}

function CommentItem({
  clearPendingComment,
  comment,
  editItem,
  pendingComment,
  type,
}: {
  clearPendingComment: () => void;
  comment: Comment | Reply;
  editItem: (comment: Comment | Reply) => void;
  pendingComment: PendingComment | null;
  type: "comment" | "reply";
}) {
  const isEditing = Boolean(pendingComment?.comment?.id == comment.id);
  const showOptions = !isEditing;

  return (
    <div className="space-y-1.5 group">
      <CommentItemHeader {...{ comment, editItem, showOptions }} />
      <ExistingCommentEditor
        clearPendingComment={clearPendingComment}
        comment={comment}
        editItem={editItem}
        type={type}
        editable={pendingComment?.comment.id === comment.id}
      />
    </div>
  );
}

type PropsFromParent = {
  comment: Comment;
  comments: Comment[];
};
type CommentCardProps = PropsFromRedux & PropsFromParent;

export const FocusContext = React.createContext({
  autofocus: false,
  isFocused: false,
  blur: () => {},
  close: () => {},
});

export function CommentCard({
  clearPendingComment,
  comment,
  currentTime,
  editItem,
  executionPoint,
  hoveredComment,
  pendingComment,
  seekToComment,
  setHoveredComment,
}: CommentCardProps) {
  const isPaused = currentTime === comment.time && executionPoint === comment.point;

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const replyKeys = commentKeys(comment.replies);

  if (comment.id === PENDING_COMMENT_ID) {
    return (
      <div
        className={`mx-auto w-full group border-b last:border-b-0 border-gray-300 cursor-pointer transition bg-gray-50`}
        onMouseEnter={() => setHoveredComment(PENDING_COMMENT_ID)}
        onMouseLeave={() => setHoveredComment(null)}
        onMouseDown={() => {
          trackEvent("comments.focus");
          setIsFocused(true);
        }}
      >
        <div className={classNames("py-2.5 w-full border-l-2 border-secondaryAccent")}>
          <div className={classNames("px-2.5 pl-2 space-y-2")}>
            {comment.sourceLocation && <CommentSource comment={comment} />}
            <FocusContext.Provider
              value={{
                autofocus: true,
                isFocused,
                blur: () => setIsFocused(false),
                close: () => setIsEditorOpen(false),
              }}
            >
              {/* <NewCommentEditor comment={comment} type={"new_comment"} /> */}
            </FocusContext.Provider>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames(
        `mx-auto relative w-full border-b last:border-b-0 border-gray-300 cursor-pointer transition bg-white`
        // hoveredComment === comment.id ? "bg-toolbarBackground" : "bg-white"
      )}
      onMouseDown={e => {
        seekToComment(comment);
      }}
      onMouseEnter={() => setHoveredComment(comment.id)}
      onMouseLeave={() => setHoveredComment(null)}
    >
      <div
        className={classNames("p-2.5 pl-2 space-y-2 border-l-2", {
          "border-secondaryAccent": isPaused,
          "border-transparent": !isPaused,
        })}
      >
        {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
        <CommentItem
          clearPendingComment={clearPendingComment}
          editItem={editItem}
          type="comment"
          comment={comment as Comment}
          pendingComment={pendingComment}
        />
        {comment.replies?.map((reply: Reply, i: number) => (
          <div key={replyKeys[i]}>
            <CommentItem
              clearPendingComment={clearPendingComment}
              editItem={editItem}
              type="reply"
              comment={reply}
              pendingComment={pendingComment}
            />
          </div>
        ))}
        {isEditorOpen ? (
          <FocusContext.Provider
            value={{
              autofocus: isFocused,
              isFocused,
              blur: () => setIsFocused(false),
              close: () => setIsEditorOpen(false),
            }}
          >
            <NewCommentEditor
              key={PENDING_COMMENT_ID}
              comment={{ ...comment, content: "", parentId: comment.id, id: PENDING_COMMENT_ID }}
              type={"new_reply"}
            />
          </FocusContext.Provider>
        ) : (
          <div className="border-transparent border pl-1">
            <button
              className="w-1/2 text-left text-gray-400 hover:text-primaryAccent focus:outline-none focus:text-primaryAccent"
              onClick={() => {
                setIsEditorOpen(true);
                setIsFocused(true);
              }}
            >
              Reply
            </button>
          </div>
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
    clearPendingComment: actions.clearPendingComment,
    editItem: actions.editItem,
    seekToComment: actions.seekToComment,
    setHoveredComment: actions.setHoveredComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCard);
