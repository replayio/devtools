import { useGetComments } from "./useGetComments";
import { useAddComment } from "./useAddComment";
import { useUpdateComment } from "./useUpdateComment";
import { useDeleteComment } from "./useDeleteComment";
import { useMakeFromPendingComment } from "./useMakeFromPendingComment";

export const commentsHooks = {
  useGetComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useMakeFromPendingComment,
};
