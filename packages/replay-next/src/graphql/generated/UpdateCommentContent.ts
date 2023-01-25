/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCommentContent
// ====================================================

export interface UpdateCommentContent_updateComment {
  __typename: "UpdateComment";
  success: boolean | null;
}

export interface UpdateCommentContent {
  updateComment: UpdateCommentContent_updateComment;
}

export interface UpdateCommentContentVariables {
  newContent: string;
  commentId: string;
  position?: any | null;
}
