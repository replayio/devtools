import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import Markdown from "react-markdown";
const emoji = require("remark-emoji");
import {
  Comment,
  PendingEditComment,
  PendingEditReply,
  PendingNewComment,
  PendingNewReply,
} from "ui/state/comments";
import CommentActions from "./CommentActions";
import "./CommentItem.css";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import ExistingCommentEditor from "./CommentEditor/ExistingCommentEditor";
import NewCommentEditor from "./CommentEditor/NewCommentEditor";

type CommentProps = PropsFromRedux & {
  comment: Comment | PendingNewComment | PendingNewReply | PendingEditReply | PendingEditComment;
  isRoot: boolean;
};

function CommentItem({ comment, pendingComment, isRoot }: CommentProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isPendingNew =
    pendingComment &&
    (pendingComment.type == "new_reply" || pendingComment.type == "new_comment") &&
    pendingComment.comment == comment;
  const isPendingEdit =
    pendingComment &&
    (pendingComment.type == "edit_reply" || pendingComment.type == "edit_comment") &&
    "id" in comment &&
    pendingComment.comment.id == comment.id;

  // If this item matches the current pending comment, display the corresponding comment editor instead.
  if (pendingComment && (isPendingNew || isPendingEdit)) {
    if (isPendingNew) {
      const commentType = pendingComment.type as "new_comment" | "new_reply";
      const comment = pendingComment.comment as PendingNewComment | PendingNewReply;

      return <NewCommentEditor comment={comment} type={commentType} />;
    } else {
      const comment = pendingComment.comment as PendingEditComment | PendingEditReply;

      return <ExistingCommentEditor comment={comment} />;
    }
  }

  const { picture, name } = (comment as Comment).user;

  return (
    <div
      className={classnames("comment-body-item", { hover: isHovered })}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="comment-body-header">
        <img src={picture} className="comment-picture" />
        <div className="comment-body-header-label">
          <div className="comment-body-header-label-name">{name}</div>
          <div className="item-content">
            <Markdown className="item-content" plugins={[[emoji, { emoticon: true }]]}>
              {comment.content}
            </Markdown>
          </div>
        </div>
        <CommentActions comment={comment as Comment} isRoot={isRoot} />
      </div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  pendingComment: selectors.getPendingComment(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentItem);
