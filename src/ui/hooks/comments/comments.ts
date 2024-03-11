import assert from "assert";
import { ApolloError, gql, useMutation, useQuery } from "@apollo/client";
import { RecordingId } from "@replayio/protocol";
import { useMemo } from "react";

import { query } from "shared/graphql/apolloClient";
import { GetComments, GetCommentsVariables } from "shared/graphql/generated/GetComments";
import {
  GetCommentsTime,
  GetCommentsTimeVariables,
} from "shared/graphql/generated/GetCommentsTime";
import {
  UpdateCommentContent,
  UpdateCommentContentVariables,
} from "shared/graphql/generated/UpdateCommentContent";
import {
  UpdateCommentReplyContent,
  UpdateCommentReplyContentVariables,
} from "shared/graphql/generated/UpdateCommentReplyContent";
import { Comment } from "shared/graphql/types";
import { GET_COMMENTS, GET_COMMENTS_TIME } from "ui/graphql/comments";

export function useGetComments(recordingId: RecordingId): {
  comments: Comment[];
  loading: boolean;
  error?: ApolloError;
} {
  const { data, loading, error } = useQuery<GetComments, GetCommentsVariables>(GET_COMMENTS, {
    variables: { recordingId },
  });

  if (error) {
    console.error("Apollo error while fetching comments:", error);
  }

  const comments = useMemo(() => {
    return (data?.recording?.comments ?? []).map(comment => {
      assert(comment.user);

      return {
        ...comment,
        isPublished: comment.isPublished != null,
        recordingId,
        replies: comment.replies.map(reply => {
          assert(reply.user);

          return {
            ...reply,
            isPublished: reply.isPublished != null,
            recordingId,
            parentId: comment.id,
            hasFrames: comment.hasFrames,
            time: comment.time,
            point: comment.point,
            type: null,
            typeData: null,
            user: reply.user,
          };
        }),
        user: comment.user,
      };
    });
  }, [data, recordingId]);

  return { comments, loading, error };
}

export function useUpdateComment() {
  const [updateCommentContent] = useMutation<UpdateCommentContent, UpdateCommentContentVariables>(
    gql`
      mutation UpdateCommentContent(
        $newContent: String!
        $newIsPublished: Boolean!
        $commentId: ID!
      ) {
        updateComment(
          input: { id: $commentId, content: $newContent, isPublished: $newIsPublished }
        ) {
          success
        }
      }
    `
  );

  return async (commentId: string, newContent: string, newIsPublished: boolean) =>
    updateCommentContent({
      // @ts-ignore TypeScript types don't yet know about the $newIsPublished variable
      variables: { commentId, newIsPublished, newContent },
    });
}

export function useUpdateCommentReply() {
  const [updateCommentReplyContent] = useMutation<
    UpdateCommentReplyContent,
    UpdateCommentReplyContentVariables
  >(
    gql`
      mutation UpdateCommentReplyContent(
        $id: ID!
        $newContent: String!
        $newIsPublished: Boolean!
      ) {
        updateCommentReply(input: { id: $id, content: $newContent, isPublished: $newIsPublished }) {
          success
        }
      }
    `
  );

  return async (id: string, newContent: string, newIsPublished: boolean) =>
    updateCommentReplyContent({
      // @ts-ignore TypeScript types don't yet know about the $newIsPublished variable
      variables: { id, newContent, newIsPublished },
    });
}

export async function getFirstComment(
  recordingId: string
): Promise<{ time: number; point: string; hasFrames: boolean } | undefined> {
  const commentsResult = await query<GetCommentsTime, GetCommentsTimeVariables>({
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
