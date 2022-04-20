import React, { useEffect, useState } from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import classNames from "classnames";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { formatRelativeTime } from "ui/utils/comments";
import useAuth0 from "ui/utils/useAuth0";

import NewCommentEditor from "./CommentEditor/NewCommentEditor";
import { Comment, Reply } from "ui/state/comments";
import ExistingCommentEditor from "./CommentEditor/ExistingCommentEditor";
import CommentActions from "./CommentActions";
import CommentSource from "./CommentSource";

import { AvatarImage } from "ui/components/Avatar";
import { trackEvent } from "ui/utils/telemetry";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { features } from "ui/utils/prefs";
import { getFocusRegion } from "ui/reducers/timeline";
import NetworkRequestPreview from "./NetworkRequestPreview";
import { useFeature } from "ui/hooks/settings";
import { CommentData } from "./types";
import { useGetUserId } from "ui/hooks/users";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

type PendingCommentProps = {
  comment: Comment;
  isFocused: boolean;
  isUpdating: boolean;
  setIsEditorOpen: (isEditorOpen: boolean) => void;
  setHoveredComment: (id: string | null) => void;
  setIsFocused: (b: boolean) => void;
  onSubmit: (data: CommentData, inputValue: string) => void;
};

function PendingCommentCard({
  comment,
  isFocused,
  isUpdating,
  setHoveredComment,
  setIsFocused,
  setIsEditorOpen,
  onSubmit,
}: PendingCommentProps) {
  return (
    <div
      className={`group mx-auto w-full cursor-pointer border-b border-splitter bg-themeBase-90 transition`}
      onMouseEnter={() => setHoveredComment(comment.id)}
      onMouseLeave={() => setHoveredComment(null)}
      onMouseDown={() => {
        trackEvent("comments.focus");
        setIsFocused(true);
      }}
    >
      <div className={classNames("w-full border-l-2 border-secondaryAccent py-2.5")}>
        <div className={classNames("space-y-2 px-2.5 pl-2")}>
          <CommentTarget comment={comment} />
          <FocusContext.Provider
            value={{
              autofocus: true,
              isFocused,
              blur: () => setIsFocused(false),
              close: () => setIsEditorOpen(false),
            }}
          >
            <NewCommentEditor
              data={{ comment, type: "new_comment" }}
              editable={!isUpdating}
              onSubmit={onSubmit}
            />
          </FocusContext.Provider>
        </div>
      </div>
    </div>
  );
}

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
  setIsEditing,
}: {
  comment: Comment | Reply;
  showOptions: boolean;
  setIsEditing: (isEditing: boolean) => void;
}) {
  const [relativeDate, setRelativeDate] = useState("");

  useEffect(() => {
    setRelativeDate(formatRelativeTime(new Date(comment.createdAt)));
  }, [comment.createdAt]);

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
      {showOptions ? (
        <CommentActions
          comment={comment}
          isRoot={"replies" in comment}
          setIsEditing={setIsEditing}
        />
      ) : null}
    </div>
  );
}

function CommentItem({
  data,
  onSubmit,
  isUpdating,
}: {
  data: CommentData;
  onSubmit: (data: CommentData, inputValue: string) => void;
  isUpdating: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { userId } = useGetUserId();

  const maybeSetIsUpdating = (value: boolean) => {
    if (!isUpdating) {
      setIsEditing(value);
    }
  };

  return (
    <div className="group space-y-1.5">
      <CommentItemHeader
        comment={data.comment}
        showOptions={!isEditing && !isUpdating && data.comment.user.id === userId}
        setIsEditing={maybeSetIsUpdating}
      />
      <ExistingCommentEditor
        data={data}
        onSubmit={onSubmit}
        isEditing={isEditing}
        setIsEditing={maybeSetIsUpdating}
      />
    </div>
  );
}

function CommentTarget({ comment }: { comment: Comment }) {
  const { value: networkRequestComments } = useFeature("networkRequestComments");

  if (comment.sourceLocation) {
    return <CommentSource comment={comment} />;
  } else if (comment.networkRequestId && networkRequestComments) {
    return <NetworkRequestPreview networkRequestId={comment.networkRequestId} />;
  }

  return null;
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
  clearPendingComment,
  setModal,
  seekToComment,
  setHoveredComment,
}: CommentCardProps) {
  const isPaused = currentTime === comment.time && executionPoint === comment.point;
  const focusRegion = useSelector(getFocusRegion);
  const isOutsideFocusedRegion =
    focusRegion && (comment.time < focusRegion.startTime || comment.time > focusRegion.endTime);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isAuthenticated } = useAuth0();
  const addComment = hooks.useAddComment();
  const addCommentReply = hooks.useAddCommentReply();
  const updateComment = hooks.useUpdateComment();
  const updateCommentReply = hooks.useUpdateCommentReply();

  const onAttachmentClick = () =>
    setModal("attachment", {
      comment: { ...comment, content: "", parentId: comment.id },
    });

  const onSubmit = async (data: CommentData, inputValue: string) => {
    const { type, comment } = data;
    if (!isAuthenticated) {
      setModal("login");
      return;
    }

    setIsUpdating(true);
    if (type == "new_reply") {
      await addCommentReply({ ...comment, content: inputValue });
    } else if (type == "new_comment") {
      await addComment({ ...comment, content: inputValue });
    } else if (type === "comment") {
      await updateComment(comment.id, inputValue, (comment as Comment).position);
    } else if (type === "reply") {
      await updateCommentReply(comment.id, inputValue);
    }

    setIsUpdating(false);
    clearPendingComment();
  };

  if (comment.isUnpublished) {
    return (
      <PendingCommentCard
        comment={comment}
        isFocused={isFocused}
        isUpdating={isUpdating}
        setHoveredComment={setHoveredComment}
        setIsFocused={setIsFocused}
        setIsEditorOpen={setIsEditorOpen}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <div
      className={classNames(
        `comment-card relative mx-auto w-full cursor-pointer border-b border-splitter transition`,
        isOutsideFocusedRegion ? "opacity-30" : "bg-bodyBgcolor"
      )}
      onMouseDown={e => {
        seekToComment(comment);
      }}
      title={
        isOutsideFocusedRegion ? "This comment is currently outside of the focused region" : ""
      }
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
        <CommentTarget comment={comment} />
        <CommentItem
          data={{ type: "comment", comment }}
          onSubmit={onSubmit}
          isUpdating={isUpdating}
        />

        {comment.replies?.map((reply: Reply) => (
          <div key={reply.id}>
            <CommentItem
              data={{ type: "reply", comment: reply }}
              onSubmit={onSubmit}
              isUpdating={isUpdating}
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
              data={{
                type: "new_reply",
                comment: {
                  ...comment,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  content: "",
                  isUnpublished: true,
                  parentId: comment.id,
                },
              }}
              onSubmit={onSubmit}
            />
          </FocusContext.Provider>
        ) : (
          <div className="flex justify-between border border-transparent pl-1">
            <button
              className="w-1/2 text-left text-gray-400 hover:text-primaryAccent focus:text-primaryAccent focus:outline-none"
              disabled={isUpdating}
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
    seekToComment: actions.seekToComment,
    setHoveredComment: actions.setHoveredComment,
    setModal: actions.setModal,
    clearPendingComment: actions.clearPendingComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCard);
