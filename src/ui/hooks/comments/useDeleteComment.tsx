import { gql, useMutation } from "@apollo/client";

import { DeleteComment, DeleteCommentVariables } from "shared/graphql/generated/DeleteComment";

export default function useDeleteComment() {
  const [deleteComment] = useMutation<DeleteComment, DeleteCommentVariables>(
    gql`
      mutation DeleteComment($commentId: ID!) {
        deleteComment(input: { id: $commentId }) {
          success
        }
      }
    `
  );

  return async (commentId: string) => {
    return deleteComment({
      variables: { commentId },
    });
  };
}
