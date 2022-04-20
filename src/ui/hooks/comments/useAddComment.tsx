import { ApolloError, gql, useMutation } from "@apollo/client";
import { Comment } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";
import omit from "lodash/omit";
import { AddComment, AddCommentVariables } from "graphql/AddComment";

export default function useAddComment() {
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

    return new Promise((resolve, reject) => {
      addComment({
        awaitRefetchQueries: true,
        onCompleted: (data: Comment | {}) => {
          resolve(data);
        },
        onError: (error: ApolloError) => {
          console.error("Apollo error while adding a comment:", error);

          reject(error);
        },
        variables: {
          input: {
            ...omit(comment, ["id", "createdAt", "updatedAt", "isUnpublished", "replies", "user"]),
            recordingId: comment.recordingId,
          },
        },
      });
    });
  };
}
