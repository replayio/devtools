const PREFIX = "comments.newComment.";

const setComment = (recordingId: string, serializedEditorState: string): void => {
  localStorage.setItem(`${PREFIX}${recordingId}`, serializedEditorState);
};

const getComment = (recordingId: string): string | null => {
  return localStorage.getItem(`${PREFIX}${recordingId}`);
};

const clearComment = (recordingId: string): void => {
  localStorage.removeItem(`${PREFIX}${recordingId}`);
};

export const commentsLocalStorage = {
  setComment,
  getComment,
  clearComment,
} as const;
