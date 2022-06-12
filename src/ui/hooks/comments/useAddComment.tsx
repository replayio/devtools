import { FetchResult, gql, useMutation } from "@apollo/client";
import { AddComment, AddCommentVariables } from "graphql/AddComment";
import omit from "lodash/omit";
import { Comment } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";

export type AddCommentMutation = (comment: Comment) => Promise<FetchResult<AddComment>>;

export default function useAddComment(): AddCommentMutation {
  const [addComment] = useMutation<AddComment, AddCommentVariables>(
    gql`
      mutation AddComment($input: AddCommentInput!) {
        addComment(input: $input) {
          success
          comment {
            id
          }
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (comment: Comment) => {
    trackEvent("comments.create");

    return addComment({
      awaitRefetchQueries: true,
      variables: {
        input: {
          ...omit(comment, ["id", "createdAt", "updatedAt", "replies", "user"]),
          recordingId: comment.recordingId,
        },
      },
    });
  };
}
