import React from "react";
import { Comment, Reply } from "ui/state/comments";

export type CommentData =
  | { type: "comment"; comment: Comment }
  | { type: "new_comment"; comment: Comment }
  | { type: "reply"; comment: Reply }
  | { type: "new_reply"; comment: Reply };

export const FocusContext = React.createContext({
  autofocus: false,
  isFocused: false,
  blur: () => {},
  close: () => {},
});
