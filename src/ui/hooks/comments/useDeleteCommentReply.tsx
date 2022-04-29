import { gql, useMutation } from "@apollo/client";
import { DeleteCommentReply, DeleteCommentReplyVariables } from "graphql/DeleteCommentReply";

export default function useDeleteCommentReply() {
  const [deleteCommentReply] = useMutation<DeleteCommentReply, DeleteCommentReplyVariables>(
    gql`
      mutation DeleteCommentReply($commentReplyId: ID!) {
        deleteCommentReply(input: { id: $commentReplyId }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (commentReplyId: string) => {
    return deleteCommentReply({
      awaitRefetchQueries: true,
      variables: { commentReplyId },
    });
  };
}
