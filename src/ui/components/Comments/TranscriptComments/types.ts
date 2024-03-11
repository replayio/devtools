import { Comment, Reply } from "shared/graphql/types";

export type CommentData =
  | { type: "comment"; comment: Comment }
  | { type: "new_comment"; comment: Comment }
  | { type: "reply"; comment: Reply }
  | { type: "new_reply"; comment: Reply };
