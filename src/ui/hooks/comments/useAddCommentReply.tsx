import { gql, useMutation } from "@apollo/client";
import { AddCommentReply, AddCommentReplyVariables } from "graphql/AddCommentReply";
import { Reply } from "ui/state/comments";

export default function useAddCommentReply() {
  const [addCommentReply] = useMutation<AddCommentReply, AddCommentReplyVariables>(
    gql`
      mutation AddCommentReply($input: AddCommentReplyInput!) {
        addCommentReply(input: $input) {
          success
          commentReply {
            id
          }
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (reply: Reply) => {
    return addCommentReply({
      awaitRefetchQueries: true,
      variables: {
        input: {
          commentId: reply.parentId,
          content: reply.content,
        },
      },
    });
  };
}
