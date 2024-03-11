import { MouseEventHandler, useState } from "react";

import { Comment } from "shared/graphql/types";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { setModal } from "ui/actions/app";
import useAddCommentReply from "ui/hooks/comments/useAddCommentReply";
import { useAppDispatch } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

import MaterialIcon from "../shared/MaterialIcon";
import styles from "./CommentReplyButton.module.css";

export default function CommentReplyButton({ comment }: { comment: Comment }) {
  const { isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();

  const addCommentReply = useAddCommentReply();

  const [commentAttachments] = useGraphQLUserData("feature_commentAttachments");

  // This should be replaced with useTransition() once we're using Suspense for comment data.
  const [isPending, setIsPending] = useState(false);

  // Un-authenticated users can't comment on Replays.
  if (!isAuthenticated) {
    return null;
  }

  const addReply: MouseEventHandler = async event => {
    event.stopPropagation();
    setIsPending(true);

    // By default, a Reply is a new unpublished comment.
    await addCommentReply({
      commentId: comment.id,
      content: "",
      isPublished: false,
    });

    setIsPending(false);
  };

  const addAttachment = () => {
    dispatch(
      setModal("attachment", {
        comment: { ...comment, content: "", parentId: comment.id },
      })
    );
  };

  return (
    <div className={styles.Row}>
      <button
        className={styles.Button}
        data-test-name="CommentReplyButton"
        disabled={isPending}
        onClick={addReply}
      >
        Reply
      </button>

      {commentAttachments && (
        <MaterialIcon className={styles.AttachmentIcon} onClick={addAttachment}>
          attachment
        </MaterialIcon>
      )}
    </div>
  );
}
