/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCommentReplyContent
// ====================================================

export interface UpdateCommentReplyContent_updateCommentReply {
  __typename: "UpdateCommentReply";
  success: boolean | null;
}

export interface UpdateCommentReplyContent {
  updateCommentReply: UpdateCommentReplyContent_updateCommentReply;
}

export interface UpdateCommentReplyContentVariables {
  newContent: string;
  commentId: string;
}
