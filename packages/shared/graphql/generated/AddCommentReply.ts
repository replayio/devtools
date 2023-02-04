/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AddCommentReplyInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddCommentReply
// ====================================================

export interface AddCommentReply_addCommentReply_commentReply {
  __typename: "CommentReply";
  id: string;
}

export interface AddCommentReply_addCommentReply {
  __typename: "AddCommentReply";
  success: boolean | null;
  commentReply: AddCommentReply_addCommentReply_commentReply;
}

export interface AddCommentReply {
  addCommentReply: AddCommentReply_addCommentReply;
}

export interface AddCommentReplyVariables {
  input: AddCommentReplyInput;
}
