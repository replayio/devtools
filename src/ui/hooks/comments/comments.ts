import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation, ApolloError } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { Comment } from "ui/state/comments";

const NO_COMMENTS: Comment[] = [];
export const GET_COMMENTS = gql`
  query GetComments($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      comments {
        id
        content
        createdAt
        updatedAt
        hasFrames
        sourceLocation
        time
        point
        position
        user {
          id
          name
          picture
        }
        replies {
          id
          content
          createdAt
          updatedAt
          user {
            id
            name
            picture
          }
        }
      }
    }
  }
`;

export function useGetComments(
  recordingId: RecordingId
): { comments: Comment[]; loading: boolean; error?: ApolloError } {
  const { data, loading, error } = useQuery(GET_COMMENTS, {
    variables: { recordingId },
  });

  if (error) {
    console.error("Apollo error while fetching comments:", error);
  }

  let comments = data?.recording?.comments || NO_COMMENTS;
  comments = comments.map((comment: any) => ({
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
  const [updateCommentContent, { error }] = useMutation(
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

  return updateCommentContent;
}

export function useUpdateCommentReply() {
  const [updateCommentReplyContent, { error }] = useMutation(
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

  return updateCommentReplyContent;
}

export async function getFirstComment(
  recordingId: string
): Promise<{ time: number; point: string; hasFrames: boolean } | undefined> {
  const commentsResult = await query({
    query: gql`
      query GetCommentsTime($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          comments {
            id
            hasFrames
            point
            time
          }
        }
      }
    `,
    variables: { recordingId },
  });

  if (!commentsResult.data?.recording?.comments) {
    return undefined;
  }
  const comments = [...commentsResult.data.recording.comments];
  comments.sort((c1: any, c2: any) => c1.time - c2.time);
  return comments[0];
}
