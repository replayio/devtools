import { RecordingId } from "@recordreplay/protocol";
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
      mutation UpdateCommentContent($newContent: String!, $commentId: ID!, $position: JSONObject) {
        updateComment(input: { id: $commentId, content: $newContent, position: $position }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (commentId: string, newContent: string, position: CommentPosition | null) =>
    updateCommentContent({
      variables: { commentId, newContent, position },
    });
}

export function useUpdateCommentReply() {
  const [updateCommentReplyContent] = useMutation<
    UpdateCommentReplyContent,
    UpdateCommentReplyContentVariables
  >(
    gql`
      mutation UpdateCommentReplyContent($newContent: String!, $commentId: ID!) {
        updateCommentReply(input: { id: $commentId, content: $newContent }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  return async (commentId: string, newContent: string) =>
    updateCommentReplyContent({
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
