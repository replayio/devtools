import { useState } from "react";
import useAddCommentReply from "ui/hooks/comments/useAddCommentReply";
import { Comment } from "ui/state/comments";
import useAuth0 from "ui/utils/useAuth0";

import styles from "./CommentReplyButton.module.css";

export default function CommentReplyButton({ comment }: { comment: Comment }) {
  const { isAuthenticated } = useAuth0();

  const addCommentReply = useAddCommentReply();

  // This should be replaced with useTransition() once we're using Suspense for comment data.
  const [isPending, setIsPending] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const addReply = async () => {
    setIsPending(true);

    // By default, a Reply is a new unpublished comment.
    await addCommentReply({
      commentId: comment.id,
      content: "",
      isPublished: false,
    });

    setIsPending(false);
  };

  return (
    <button className={styles.Button} disabled={isPending} onClick={addReply}>
      Reply
    </button>
  );
}
