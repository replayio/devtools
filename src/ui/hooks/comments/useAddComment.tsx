import { Comment } from "ui/state/comments";
import { ApolloCache, gql, useMutation } from "@apollo/client";
import { GqlGetComments, GET_COMMENTS, GqlComment, U2N } from "ui/graphql/comments";
import { trackEvent } from "ui/utils/telemetry";
import omit from "lodash/omit";
import { GET_USER_ID } from "ui/graphql/users";

type AddCommentData = {
  addComment: {
    success: boolean;
    comment: {
      id: Comment["id"];
    };
  };
};

type AddCommentVariables = {
  input: Omit<Comment, "id" | "createdAt" | "updatedAt" | "replies" | "user">;
};

export default function useAddComment() {
  const [addComment, { error }] = useMutation<
    AddCommentData,
    AddCommentVariables,
    {},
    ApolloCache<GqlGetComments>
  >(
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

    addComment({
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
            id: comment.id,
          },
        },
      },
      update: (cache, { data }) => {
        const commentId = data!.addComment.comment.id;
        const getCommentsCache = cache.readQuery<GqlGetComments>({
          query: GET_COMMENTS,
          variables: { recordingId: comment.recordingId },
        })!;
        const userId = (
          cache.readQuery({
            query: GET_USER_ID,
          }) as any
        ).viewer.user.id;

        const newComment: U2N<Comment> = {
          ...comment,
          id: commentId,
          primaryLabel: comment.primaryLabel || null,
          secondaryLabel: comment.secondaryLabel || null,
          user: {
            id: userId,
            name: comment.user.name,
            picture: comment.user.picture,
            internal: comment.user.internal,
          },
        };
        const newData = {
          ...getCommentsCache,
          recording: {
            ...getCommentsCache.recording,
            comments: [
              ...getCommentsCache.recording.comments.filter(c => c.id !== commentId),
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
