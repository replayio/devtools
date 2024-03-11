import { FetchResult, gql, useMutation } from "@apollo/client";
import omit from "lodash/omit";

import { AddComment, AddCommentVariables } from "shared/graphql/generated/AddComment";
import { Comment } from "shared/graphql/types";
import { trackEvent } from "ui/utils/telemetry";

export type AddCommentMutation = (comment: Comment) => Promise<FetchResult<AddComment>>;

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) {
      success
      comment {
        id
      }
    }
  }
`;

export default function useAddComment(): AddCommentMutation {
  const [addComment] = useMutation<AddComment, AddCommentVariables>(ADD_COMMENT_MUTATION);

  return async (comment: Comment) => {
    trackEvent("comments.create");

    return addComment({
      variables: {
        input: {
          ...omit(comment, ["createdAt", "id", "isPublished", "replies", "updatedAt", "user"]),
          isPublished: comment.isPublished === true,
          recordingId: comment.recordingId,
        },
      },
    });
  };
}
