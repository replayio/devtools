/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteComment
// ====================================================

export interface DeleteComment_deleteComment {
  __typename: "DeleteComment";
  success: boolean | null;
}

export interface DeleteComment {
  deleteComment: DeleteComment_deleteComment;
}

export interface DeleteCommentVariables {
  commentId: string;
}
