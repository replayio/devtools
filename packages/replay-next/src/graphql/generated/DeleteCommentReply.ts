/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCommentReply
// ====================================================

export interface DeleteCommentReply_deleteCommentReply {
  __typename: "DeleteCommentReply";
  success: boolean | null;
}

export interface DeleteCommentReply {
  deleteCommentReply: DeleteCommentReply_deleteCommentReply;
}

export interface DeleteCommentReplyVariables {
  commentReplyId: string;
}
