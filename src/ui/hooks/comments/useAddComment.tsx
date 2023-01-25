import { FetchResult, gql, useMutation } from "@apollo/client";
import omit from "lodash/omit";

import { AddComment, AddCommentVariables } from "graphql/AddComment";
import { Comment } from "ui/state/comments";
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
          ...omit(comment, [
            "createdAt",
            "id",
            "isPublished",
            "replies",
            "updatedAt",
            "user",

            // TODO [FE-1058] Legacy fields
            "networkRequestId",
            "position",
            "primaryLabel",
            "secondaryLabel",
            "sourceLocation",
          ]),
          isPublished: comment.isPublished === true,
          recordingId: comment.recordingId,
        },
      },
    });
  };
}
