import * as comments from "./comments";
import useAddComment from "./useAddComment";
import useAddCommentReply from "./useAddCommentReply";
import useDeleteComment from "./useDeleteComment";
import useDeleteCommentReply from "./useDeleteCommentReply";

export const commentsHooks = {
  ...comments,
  useAddComment,
  useAddCommentReply,
  useDeleteComment,
  useDeleteCommentReply,
};
