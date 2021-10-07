import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import NewCommentEditor from "./CommentEditor/NewCommentEditor";
import { Comment, PendingNewComment, PendingNewReply } from "ui/state/comments";

type CommentCardFooterProps = PropsFromRedux & {
  comment: PendingNewComment | Comment;
  onReply: (e: React.MouseEvent) => void;
};

function NewComment({
  pendingComment,
  comment,
  replyPrompt,
}: {
  pendingComment: PendingNewComment;
  comment: PendingNewComment | Comment;
  replyPrompt: React.ReactElement;
}) {
  // Don't show the editor if this comment card's root comment is not the
  // pendingComment itself.
  if (pendingComment !== comment) {
    return replyPrompt;
  }

  return (
    <div>
      <NewCommentEditor comment={pendingComment} type={"new_comment"} />
    </div>
  );
}

function NewReply({
  pendingComment,
  comment,
  replyPrompt,
}: {
  pendingComment: PendingNewReply;
  comment: Comment;
  replyPrompt: React.ReactElement;
}) {
  // Don't show the editor if the pending reply's supposed parent does not match
  // this comment card's root comment.
  if (pendingComment.parentId !== comment.id) {
    return replyPrompt;
  }

  return (
    <div>
      <NewCommentEditor comment={pendingComment} type={"new_reply"} />
    </div>
  );
}

export function ReplyPrompt({ onReply }: { onReply?: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="border border-gray-400 rounded-md bg-gray-100 hover:bg-gray-200 py-1 px-2 opacity-75 hover:opacity-100 transition"
      onClick={onReply}
    >
      Write a reply...
    </div>
  );
}

function CommentCardFooter({ comment, pendingComment, onReply }: CommentCardFooterProps) {
  let footer;

  // Case 1 and 2: Editing a comment/reply.
  if (
    !pendingComment ||
    pendingComment.type === "edit_comment" ||
    pendingComment.type === "edit_reply"
  ) {
    footer = <ReplyPrompt {...{ onReply }} />;
  } else if (pendingComment.type === "new_comment") {
    // Case 3: Adding a comment.
    footer = (
      <NewComment
        pendingComment={pendingComment.comment}
        comment={comment}
        replyPrompt={<ReplyPrompt {...{ onReply }} />}
      />
    );
  } else {
    // Case 4: Adding a reply.
    footer = (
      <NewReply
        pendingComment={pendingComment.comment}
        comment={comment as Comment}
        replyPrompt={<ReplyPrompt {...{ onReply }} />}
      />
    );
  }

  return <div style={{ lineHeight: "1.125rem" }}>{footer}</div>;
}

const connector = connect((state: UIState) => ({
  pendingComment: selectors.getPendingComment(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(CommentCardFooter);
