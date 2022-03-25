import { RecordingId } from "@recordreplay/protocol";
import { useQuery, ApolloError } from "@apollo/client";
import { Comment } from "ui/state/comments";
import { GET_COMMENTS } from "ui/graphql/comments";
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
      replies: reply.replies ?? [],
      parentId: comment.id,
    })),
  }));
  return { comments, loading, error };
}
