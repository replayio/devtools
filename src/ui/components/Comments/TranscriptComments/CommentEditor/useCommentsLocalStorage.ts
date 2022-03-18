import { useGetRecordingId } from "ui/hooks/recordings";

// three types of editable comments:
// - existing comments (zero or more active)
// - new replay comments (zero or more active)
// - pending (video) comment (zero or one active)
type Mode =
  | {
      type: "reply";
      parentId: string;
    }
  | {
      type: "existing";
      commentId: string;
    }
  | "pending";

export const useCommentsLocalStorage = (mode: Mode = "pending") => {
  const recordingId = useGetRecordingId();

  const storeKey = genStoreKey(mode, recordingId);

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

const genStoreKey = (mode: Mode, recordingId: string): string => {
  let key = `comments.newComment.${recordingId}`;
  if (mode === "pending") {
    return key + `.pending`;
  } else if (mode.type === "reply") {
    return key + `.reply.${mode.parentId}`;
  } else {
    return key + `.existing.${mode.commentId}`;
  }
};
