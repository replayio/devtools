import { gql, useMutation } from "@apollo/client";
import { DeleteComment, DeleteCommentVariables } from "graphql/DeleteComment";

export default function useDeleteComment() {
  const [deleteComment] = useMutation<DeleteComment, DeleteCommentVariables>(
    gql`
      mutation DeleteComment($commentId: ID!) {
        deleteComment(input: { id: $commentId }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (commentId: string) => {
    return deleteComment({
      awaitRefetchQueries: true,
      variables: { commentId },
    });
  };
}
