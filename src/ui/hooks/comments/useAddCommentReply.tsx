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

  return async ({
    commentId,
    content,
    isPublished,
  }: {
    commentId: string;
    content: string;
    isPublished: boolean;
  }) => {
    return addCommentReply({
      awaitRefetchQueries: true,
      variables: {
        input: {
          commentId,
          content,
          isPublished,
        },
      },
    });
  };
}
