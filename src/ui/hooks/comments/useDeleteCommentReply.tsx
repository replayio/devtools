import { gql, useMutation } from "@apollo/client";

import {
  DeleteCommentReply,
  DeleteCommentReplyVariables,
} from "shared/graphql/generated/DeleteCommentReply";

export default function useDeleteCommentReply() {
  const [deleteCommentReply] = useMutation<DeleteCommentReply, DeleteCommentReplyVariables>(
    gql`
      mutation DeleteCommentReply($commentReplyId: ID!) {
        deleteCommentReply(input: { id: $commentReplyId }) {
          success
        }
      }
    `
  );

  return async (commentReplyId: string) => {
    return deleteCommentReply({
      variables: { commentReplyId },
    });
  };
}
