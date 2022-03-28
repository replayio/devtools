import { useDispatch, useSelector } from "react-redux";
import { selectors } from "ui/reducers";
import { Comment, CommentPosition, SourceLocation } from "ui/state/comments";
import cx from "classnames";
import TipTapEditor from "../Comments/TranscriptComments/CommentEditor/TipTapEditor";
import PortalDropdown from "../shared/PortalDropdown";
import { Dropdown, DropdownItem } from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "../shared/MaterialIcon";
import { useMemo, useState } from "react";
import { AvatarImage } from "../Avatar";
import { formatRelativeTime } from "ui/utils/comments";
import { JSONContent } from "@tiptap/react";
import { tryToParse } from "./utils.comments";
import { seekToComment, setHoveredComment } from "ui/actions/comments";
import { useFeature } from "ui/hooks/settings";
import CommentSourceTarget from "./CommentSourceTarget";
import CommentNetReqTarget from "./CommentNetReqTarget";
import { getFocusRegion } from "ui/reducers/timeline";
import { commentsHooks } from "ui/hooks/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");

type CommentItemProps = {
  comment: Comment;
};

export const CommentItem = ({ comment }: CommentItemProps): JSX.Element => {
  const dispatch = useDispatch();
  const recordingId = useGetRecordingId();
  const currentTime = useSelector(selectors.getCurrentTime);
  const executionPoint = useSelector(getExecutionPoint);
  const focusRegion = useSelector(getFocusRegion);
  const { value: netReqCommentsFeature } = useFeature("networkRequestComments");
  const addComment = commentsHooks.useAddComment();
  const updateComment = commentsHooks.useUpdateComment();
  const deleteComment = commentsHooks.useDeleteComment();
  const makeFromPendingComment = commentsHooks.useMakeFromPendingComment();

  const isActivePause = currentTime === comment.time && executionPoint === comment.point;
  const isTopLevelComment = !comment.parentId;
  const isOutsideFocusedRegion =
    focusRegion && (comment.time < focusRegion.startTime || comment.time > focusRegion.endTime);

  // header
  const relativeCreationDate = formatRelativeTime(new Date(comment.createdAt));
  const showCommentActions = true;
  const [headerActionsExpanded, setHeaderActionsExpanded] = useState(false);

  // content
  const content = useMemo(() => tryToParse(comment.content), [comment.content]);
  const [isEdit, setIsEdit] = useState(false);

  // a singular pending (unsubmitted) commment reply to this one
  // other contextual data for it is in a store's pendingCommentData that we
  // will extract from when submitting
  // TODO doesn't need a state
  const [newReplyContent, setNewReplyContent] = useState<JSONContent | null>(null);

  return (
    <div
      className={cx("group cursor-pointer space-y-2", {
        "border-l-2 p-2.5": isTopLevelComment,
        "border-l-secondaryAccent": isActivePause,
        "border-l-transparent": !isActivePause,
        "border-b border-b-splitter": isTopLevelComment,
        "opacity-30": isOutsideFocusedRegion,
      })}
      onMouseEnter={() => dispatch(setHoveredComment(comment.id))}
      onMouseLeave={() => dispatch(setHoveredComment(null))}
      onMouseDown={e => {
        dispatch(seekToComment(comment));
      }}
      title={
        isOutsideFocusedRegion ? "This comment is currently outside of the focused region" : ""
      }
    >
      {/* HEADER */}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center space-x-1.5">
          <AvatarImage className="avatar h-5 w-5 rounded-full" src={comment.user.picture} />
          <div className="flex flex-grow flex-row space-x-2 overflow-hidden">
            <span className="overflow-hidden overflow-ellipsis whitespace-pre font-medium">
              {comment.user.name}
            </span>
            <span
              className="flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-pre text-gray-400"
              title={relativeCreationDate}
            >
              {relativeCreationDate}
            </span>
          </div>
        </div>
        {showCommentActions && (
          <div>
            <PortalDropdown
              buttonContent={
                <MaterialIcon
                  outlined
                  className={cx(
                    "h-4 w-4 text-gray-400 opacity-0 hover:text-primaryAccentHover group-hover:opacity-100",
                    { "opacity-100": headerActionsExpanded }
                  )}
                >
                  more_vert
                </MaterialIcon>
              }
              setExpanded={setHeaderActionsExpanded}
              expanded={headerActionsExpanded}
              buttonStyle=""
              distance={0}
              position="bottom-right"
            >
              <Dropdown>
                <DropdownItem
                  onClick={() => {
                    setIsEdit(true);
                    setHeaderActionsExpanded(false);
                  }}
                >
                  Edit comment
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    deleteComment(comment, recordingId);
                    setHeaderActionsExpanded(false);
                  }}
                >
                  {isTopLevelComment ? "Delete comment and replies" : "Delete comment"}
                </DropdownItem>
              </Dropdown>
            </PortalDropdown>
          </div>
        )}
      </div>

      {/* TARGET */}
      {comment.sourceLocation && (
        <CommentSourceTarget
          sourceLocation={comment.sourceLocation}
          secondaryLabel={comment.secondaryLabel}
        />
      )}
      {netReqCommentsFeature && comment.networkRequestId && (
        <CommentNetReqTarget networkRequestId={comment.networkRequestId} />
      )}

      {/* CONTENT */}
      <TipTapEditor
        editable={isEdit}
        content={content}
        placeholder={!comment.parentId ? "Write a reply..." : "Type a comment"}
        // autofocus
        handleCancel={() => {
          setIsEdit(false);
        }}
        handleConfirm={content => {
          setIsEdit(false);
          updateComment(comment, JSON.stringify(content));
        }}
        onCreate={({ editor }) => {
          editor.commands.focus();
        }}
      />

      {/* REPLIES */}
      {isTopLevelComment && (
        <div>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}

      {/* A NEW REPLY */}
      {newReplyContent !== null && (
        <TipTapEditor
          editable={true}
          content={newReplyContent}
          placeholder={!comment.parentId ? "Write a reply..." : "Type a comment"}
          autofocus
          handleCancel={() => {
            // setIsEdit(false);
          }}
          handleConfirm={content => {
            // @ts-ignore
            // const comment = makeFromPendingComment({
            //   /* TODO */
            // });
            // await addComment(comment);
            // setIsEdit(false);
            // updateComment(comment, JSON.stringify(content));
          }}
          onCreate={({ editor }) => {
            // editor.commands.focus();
          }}
        />
      )}

      {/* ACTIONS */}
      {isTopLevelComment && (
        <button
          className="w-1/2 text-left text-gray-400 hover:text-primaryAccent focus:text-primaryAccent focus:outline-none"
          onClick={() => {
            // setIsEditorOpen(true);
            // setIsFocused(true);
            setNewReplyContent({});
          }}
        >
          Reply
        </button>
      )}
    </div>
  );
};
