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
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { features } from "ui/utils/prefs";
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
    <div className="flex flex-row items-center space-x-1.5">
      <AvatarImage className="avatar h-5 w-5 rounded-full" src={comment.user.picture} />
      <div className="flex flex-grow flex-row space-x-2 overflow-hidden">
        <span className="overflow-hidden overflow-ellipsis whitespace-pre font-medium">
          {comment.user.name}
        </span>
        <span
          className="flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-pre text-gray-400"
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
    <div className="group space-y-1.5">
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

function CommentCard({
  comment,
  comments,
  currentTime,
  executionPoint,
  pendingComment,
  setModal,
  seekToComment,
  setHoveredComment,
}: CommentCardProps) {
  const isPaused = currentTime === comment.time && executionPoint === comment.point;

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const replyKeys = commentKeys(comment.replies);
  const onAttachmentClick = () =>
    setModal("attachment", {
      comment: { ...comment, content: "", parentId: comment.id, id: PENDING_COMMENT_ID },
    });

  if (comment.id === PENDING_COMMENT_ID) {
    return (
      <div
        className={`group mx-auto w-full cursor-pointer border-b border-gray-300 bg-themeTextField transition`}
        onMouseEnter={() => setHoveredComment(PENDING_COMMENT_ID)}
        onMouseLeave={() => setHoveredComment(null)}
        onMouseDown={() => {
          trackEvent("comments.focus");
          setIsFocused(true);
        }}
      >
        <div className={classNames("w-full border-l-2 border-secondaryAccent py-2.5")}>
          <div className={classNames("space-y-2 px-2.5 pl-2")}>
            {comment.sourceLocation && <CommentSource comment={comment} />}
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
        `comment-card relative mx-auto w-full cursor-pointer border-b border-gray-300 bg-themeBodyBackground transition`
        // hoveredComment === comment.id ? "bg-toolbarBackground" : "bg-themeBodyBackground"
      )}
      onMouseDown={e => {
        seekToComment(comment);
      }}
      onMouseEnter={() => setHoveredComment(comment.id)}
      onMouseLeave={() => setHoveredComment(null)}
    >
      <BorderBridge {...{ comments, comment, isPaused }} />
      <div
        className={classNames(" space-y-2 border-l-2 p-2.5 pl-2", {
          "border-secondaryAccent": isPaused,
          "border-transparent": !isPaused,
        })}
      >
        {comment.sourceLocation ? <CommentSource comment={comment} /> : null}
        <CommentItem type="comment" comment={comment as Comment} pendingComment={pendingComment} />
        {comment.replies?.map((reply: Reply, i: number) => (
          <div key={replyKeys[i]}>
            <CommentItem type="reply" comment={reply} pendingComment={pendingComment} />
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
              comment={{
                ...comment,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                content: "",
                parentId: comment.id,
                id: PENDING_COMMENT_ID,
              }}
              type={"new_reply"}
            />
          </FocusContext.Provider>
        ) : (
          <div className="flex justify-between border border-transparent pl-1">
            <button
              className="w-1/2 text-left text-gray-400 hover:text-primaryAccent focus:text-primaryAccent focus:outline-none"
              onClick={() => {
                setIsEditorOpen(true);
                setIsFocused(true);
              }}
            >
              Reply
            </button>

            <div className="comment-actions mr-2 select-none opacity-0">
              {features.commentAttachments && (
                <MaterialIcon className="text-gray-400" onClick={onAttachmentClick}>
                  attachment
                </MaterialIcon>
              )}
            </div>
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
    pendingComment: selectors.getPendingComment(state),
  }),
  {
    editItem: actions.editItem,
    seekToComment: actions.seekToComment,
    setHoveredComment: actions.setHoveredComment,
    setModal: actions.setModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCard);
