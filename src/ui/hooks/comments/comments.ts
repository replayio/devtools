import { RecordingId } from "@replayio/protocol";
import { gql, useQuery, useMutation, ApolloError } from "@apollo/client";
import { Comment, CommentPosition } from "ui/state/comments";
import { query } from "ui/utils/apolloClient";
import { GET_COMMENTS_TIME, GET_COMMENTS } from "ui/graphql/comments";
import { UpdateCommentContent, UpdateCommentContentVariables } from "graphql/UpdateCommentContent";
import {
  UpdateCommentReplyContent,
  UpdateCommentReplyContentVariables,
} from "graphql/UpdateCommentReplyContent";
import { GetComments, GetCommentsVariables } from "graphql/GetComments";

export function useGetComments(recordingId: RecordingId): {
  comments: Comment[];
  loading: boolean;
  error?: ApolloError;
} {
  const { data, loading, error } = useQuery<GetComments, GetCommentsVariables>(GET_COMMENTS, {
    variables: { recordingId },
    pollInterval: 5000,
  });

  if (error) {
    console.error("Apollo error while fetching comments:", error);
  }

  let comments = (data?.recording?.comments ?? []).map((comment: any) => ({
    ...comment,
    replies: comment.replies.map((reply: any) => ({
      ...reply,
      hasFrames: comment.hasFrames,
      sourceLocation: comment.sourceLocation,
      time: comment.time,
      point: comment.point,
      position: comment.position,
    })),
  }));
  return { comments, loading, error };
}

export function useUpdateComment() {
  const [updateCommentContent] = useMutation<UpdateCommentContent, UpdateCommentContentVariables>(
    gql`
      mutation UpdateCommentContent($newContent: String!, $newIsPublished: Boolean!, $commentId: ID!, $newPosition: JSONObject) {
        updateComment(input: { id: $commentId, content: $newContent, isPublished: $newIsPublished, position: $newPosition }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (commentId: string, newContent: string, newIsPublished: boolean, position: CommentPosition | null) =>
    updateCommentContent({
      // @ts-ignore TypeScript types don't yet know about the $newIsPublished variable
      variables: { commentId, newIsPublished, newContent, position },
    });
}

export function useUpdateCommentReply() {
  const [updateCommentReplyContent] = useMutation<
    UpdateCommentReplyContent,
    UpdateCommentReplyContentVariables
  >(
    gql`
      mutation UpdateCommentReplyContent($id: ID!, $newContent: String!, $newIsPublished: Boolean!) {
        updateCommentReply(input: { id: $id, content: $newContent, isPublished: $newIsPublished }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (replyId: string, newContent: string, newIsPublished: boolean) =>
    updateCommentReplyContent({
      // @ts-ignore TypeScript types don't yet know about the $newIsPublished variable
      variables: { newContent, newIsPublished, replyId },
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
