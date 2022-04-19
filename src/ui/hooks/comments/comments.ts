import { gql, useQuery, useMutation, ApolloError } from "@apollo/client";
import { RecordingId } from "@recordreplay/protocol";
import { GetComments, GetCommentsVariables } from "graphql/GetComments";
import { UpdateCommentContent, UpdateCommentContentVariables } from "graphql/UpdateCommentContent";
import {
  UpdateCommentReplyContent,
  UpdateCommentReplyContentVariables,
} from "graphql/UpdateCommentReplyContent";
import { GET_COMMENTS_TIME, GET_COMMENTS } from "ui/graphql/comments";
import { Comment, CommentPosition, Reply } from "ui/state/comments";
import { query } from "ui/utils/apolloClient";

export function useGetComments(recordingId: RecordingId): {
  comments: Comment[];
  loading: boolean;
  error?: ApolloError;
} {
  const { data, loading, error } = useQuery<GetComments, GetCommentsVariables>(GET_COMMENTS, {
    pollInterval: 5000,
    variables: { recordingId },
  });

  if (error) {
    console.error("Apollo error while fetching comments:", error);
  }

  let comments = (data?.recording?.comments ?? []).map((comment: any) => ({
    ...comment,
    replies: comment.replies.map((reply: any) => ({
      ...reply,
      hasFrames: comment.hasFrames,
      point: comment.point,
      position: comment.position,
      sourceLocation: comment.sourceLocation,
      time: comment.time,
    })),
  }));
  return { comments, error, loading };
}

export function useUpdateComment() {
  const [updateCommentContent, { error }] = useMutation<
    UpdateCommentContent,
    UpdateCommentContentVariables
  >(
    gql`
      mutation UpdateCommentContent($newContent: String!, $commentId: ID!, $position: JSONObject) {
        updateComment(input: { id: $commentId, content: $newContent, position: $position }) {
          success
        }
      }
    `
  );

  if (error) {
    console.error("Apollo error while updating a comment:", error);
  }

  return (commentId: string, newContent: string, position: CommentPosition | null) =>
    updateCommentContent({
      optimisticResponse: {
        updateComment: {
          __typename: "UpdateComment",
          success: true,
        },
      },
      update: cache => {
        cache.modify({
          fields: {
            content: () => newContent,
            position: () => position,
          },
          id: cache.identify({ __typename: "Comment", id: commentId }),
        });
      },
      variables: { commentId, newContent, position },
    });
}

export function useUpdateCommentReply() {
  const [updateCommentReplyContent, { error }] = useMutation<
    UpdateCommentReplyContent,
    UpdateCommentReplyContentVariables
  >(
    gql`
      mutation UpdateCommentReplyContent($newContent: String!, $commentId: ID!) {
        updateCommentReply(input: { id: $commentId, content: $newContent }) {
          success
        }
      }
    `
  );

  if (error) {
    console.error("Apollo error while updating a comment:", error);
  }

  return (commentId: string, newContent: string) =>
    updateCommentReplyContent({
      optimisticResponse: {
        updateCommentReply: {
          __typename: "UpdateCommentReply",
          success: true,
        },
      },
      update: cache => {
        cache.modify({
          fields: { content: () => newContent },
          id: cache.identify({ __typename: "CommentReply", id: commentId }),
        });
      },
      variables: { commentId, newContent },
    });
}

export async function getFirstComment(
  recordingId: string
): Promise<{ time: number; point: string; hasFrames: boolean } | undefined> {
  const commentsResult = await query({
    query: GET_COMMENTS_TIME,
    variables: { recordingId },
  });

  if (!commentsResult.data?.recording?.comments) {
    return undefined;
  }
  const comments = [...commentsResult.data.recording.comments];
  comments.sort((c1: any, c2: any) => c1.time - c2.time);
  return comments[0];
}
