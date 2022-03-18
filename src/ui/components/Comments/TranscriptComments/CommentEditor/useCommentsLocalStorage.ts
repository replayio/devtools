import { useGetRecordingId } from "ui/hooks/recordings";

// types of editable comments:
// - existing comments (zero or more active)
// - new replay comments (zero or more active)
// - pending comments (zero or one active)
//   - pending (video) comment
//   - pending (network request) comment
type Mode =
  | {
      type: "reply";
      parentId: string;
    }
  | {
      type: "existing";
      commentId: string;
    }
  | "video";

export const useCommentsLocalStorage = (mode: Mode) => {
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
  if (mode === "video") {
    return key + `.video`;
  } else if (mode.type === "reply") {
    return key + `.reply.${mode.parentId}`;
  } else {
    return key + `.existing.${mode.commentId}`;
  }
};
