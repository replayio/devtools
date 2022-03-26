import { Comment } from "ui/state/comments";
import { gql, useMutation } from "@apollo/client";
import { GET_COMMENTS } from "ui/graphql/comments";
import { trackEvent } from "ui/utils/telemetry";
import omit from "lodash/omit";
import { GET_USER_ID } from "ui/graphql/users";
import { AddComment, AddCommentVariables } from "graphql/AddComment";
import { GetComments } from "graphql/GetComments";

export default function useAddComment() {
  const [addComment, { error }] = useMutation<AddComment, AddCommentVariables>(
    gql`
      mutation AddComment($input: AddCommentInput!) {
        addComment(input: $input) {
          success
          comment {
            id
          }
        }
      }
    `
  );

  if (error) {
    console.error("Apollo error while adding a comment:", error);
  }

  return (comment: Comment) => {
    trackEvent("comments.create");

    comment.id = atob(comment.id).slice(2);

    return addComment({
      variables: {
        input: {
          ...omit(comment, ["createdAt", "updatedAt", "replies", "user"]),
          recordingId: comment.recordingId,
        },
      },
    });
  };
}
