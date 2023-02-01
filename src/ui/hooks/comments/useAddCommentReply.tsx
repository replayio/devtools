import { gql, useMutation } from "@apollo/client";

import {
  AddCommentReply,
  AddCommentReplyVariables,
} from "shared/graphql/generated/AddCommentReply";

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
    `
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
