const STORAGE_KEY_PREFIX = "comments.newComment.";

const setComment = (recordingId: string, serializedEditorState: string): void => {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${recordingId}`, serializedEditorState);
};

const getComment = (recordingId: string): string | null => {
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${recordingId}`);
};

const clearComment = (recordingId: string): void => {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${recordingId}`);
};

export const commentsLocalStorage = {
  setComment,
  getComment,
  clearComment,
} as const;
