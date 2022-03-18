// import { useSelector } from "react-redux";
import { useGetRecordingId } from "ui/hooks/recordings";
// import { UIState } from "ui/state";

export const useCommentsLocalStorage = (parentCommentId?: string) => {
  const recordingId = useGetRecordingId();
  // const pendingComment = useSelector((state: UIState) => state.comments.pendingComment);

  const storeKey =
    `comments.newComment.${recordingId}` + (parentCommentId ? `.${parentCommentId}` : "");

  const setComment = (serializedEditorState: string): void => {
    localStorage.setItem(storeKey, serializedEditorState);
  };

  const getComment = (): string | null => {
    return localStorage.getItem(storeKey);
  };

  const clearComment = (): void => {
    localStorage.removeItem(storeKey);
  };

  return {
    set: setComment,
    get: getComment,
    clear: clearComment,
  } as const;
};
