import { useDispatch, useSelector } from "react-redux";
import { createLabels } from "ui/actions/comments";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { UIState } from "ui/state";
import { Comment, ROOT_COMMENT_ID } from "ui/state/comments";
import { useGetRecordingId } from "../recordings";
import { useGetUserInfo } from "../users";

type MakeCommentAsyncFn = (parentId: Comment["id"] | null, content: string) => Promise<Comment>;

export const useMakeFromPendingComment = (): MakeCommentAsyncFn => {
  const recordingId = useGetRecordingId();
  const user = useGetUserInfo();
  const allPendingCommentData = useSelector((state: UIState) => state.comments.pendingCommentData);

  const makeComment: MakeCommentAsyncFn = async (parentId, content) => {
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

  return makeComment;
};
