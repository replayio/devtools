import { useSelector } from "react-redux";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { UIState } from "ui/state";
import { Comment, ROOT_COMMENT_ID } from "ui/state/comments";
import { useGetRecordingId } from "../recordings";
import { useGetUserInfo } from "../users";

type MakeCommentFn = (parentId: Comment["id"] | null, content: string) => Comment;

export const useMakeFromPendingComment = (): MakeCommentFn => {
  const recordingId = useGetRecordingId();
  const user = useGetUserInfo();
  const allPendingCommentData = useSelector((state: UIState) => state.comments.pendingCommentsData);

  return (parentId, content) => {
    const pendingCommentData = allPendingCommentData[parentId ?? ROOT_COMMENT_ID];

    return {
      id: PENDING_COMMENT_ID,
      parentId,
      createdAt: new Date().toISOString(),
      recordingId,
      replies: [],
      ...pendingCommentData,
      updatedAt: new Date().toISOString(),
      content,
      user,
    };
  };
};
