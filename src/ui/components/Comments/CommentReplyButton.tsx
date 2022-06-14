import { useState } from "react";
import { useAppDispatch } from "ui/setup/hooks";
import { setModal } from "ui/actions/app";
import useAddCommentReply from "ui/hooks/comments/useAddCommentReply";
import { Comment } from "ui/state/comments";
import { features } from "ui/utils/prefs";
import useAuth0 from "ui/utils/useAuth0";

import MaterialIcon from "../shared/MaterialIcon";

import styles from "./CommentReplyButton.module.css";

export default function CommentReplyButton({ comment }: { comment: Comment }) {
  const { isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();

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

  const addAttachment = () => {
    dispatch(
      setModal("attachment", {
        comment: { ...comment, content: "", parentId: comment.id },
      })
    );
  };

  return (
    <div className={styles.Row}>
      <button className={styles.Button} disabled={isPending} onClick={addReply}>
        Reply
      </button>

      {features.commentAttachments && (
        <MaterialIcon className={styles.AttachmentIcon} onClick={addAttachment}>
          attachment
        </MaterialIcon>
      )}
    </div>
  );
}
