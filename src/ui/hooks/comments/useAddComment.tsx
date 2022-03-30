import { Comment } from "ui/state/comments";
import { gql, useMutation } from "@apollo/client";
import { Remark } from "ui/state/comments";
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

    return addComment({
      variables: {
        input: {
          ...omit(comment, ["id", "createdAt", "updatedAt", "replies", "user"]),
          recordingId: comment.recordingId,
        },
      },
      optimisticResponse: {
        addComment: {
          success: true,
          comment: {
            id: comment["id"],
            __typename: "Comment",
          },
          __typename: "AddComment",
        },
      },
      update: (cache, { data }) => {
        const commentId = data?.addComment?.comment?.id;
        const cacheData = cache.readQuery<GetComments>({
          query: GET_COMMENTS,
          variables: { recordingId: comment.recordingId },
        })!;
        const {
          viewer: {
            user: { id: userId },
          },
        }: any = cache.readQuery({
          query: GET_USER_ID,
        });

        const newComment = {
          ...comment,
          id: commentId,
          primaryLabel: comment.primaryLabel || null,
          secondaryLabel: comment.secondaryLabel || null,
          user: {
            id: userId,
            name: comment.user.name,
            picture: comment.user.picture,
            __typename: "User",
          },
          __typename: "Comment",
        };
        const newData = {
          ...cacheData,
          recording: {
            ...cacheData.recording,
            comments: [
              ...(cacheData.recording?.comments ?? []).filter(c => c.id !== commentId),
              newComment,
            ],
          },
        };

        cache.writeQuery({
          query: GET_COMMENTS,
          variables: { recordingId: comment.recordingId },
          data: newData,
        });
      },
    });
  };
}
