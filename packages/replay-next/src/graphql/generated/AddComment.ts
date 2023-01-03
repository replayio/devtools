/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AddCommentInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddComment
// ====================================================

export interface AddComment_addComment_comment {
  __typename: "Comment";
  id: string;
}

export interface AddComment_addComment {
  __typename: "AddComment";
  success: boolean | null;
  comment: AddComment_addComment_comment;
}

export interface AddComment {
  addComment: AddComment_addComment;
}

export interface AddCommentVariables {
  input: AddCommentInput;
}
