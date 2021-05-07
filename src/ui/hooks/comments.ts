import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation, ApolloError, Reference } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { Comment } from "ui/state/comments";
import { getUserId } from "ui/utils/useToken";
import { GET_RECORDING } from "./recordings";
import useAuth0 from "ui/utils/useAuth0";
import { GET_USER_ID } from "./users";

const NO_COMMENTS: Comment[] = [];
const GET_COMMENTS = gql`
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

export function useAddComment() {
  const { user } = useAuth0();

  const [addComment, { error }] = useMutation(
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

  return (comment: any, recordingId: RecordingId) => {
    addComment({
      variables: { input: comment },
      optimisticResponse: {
        addComment: {
          success: true,
          comment: {
            id: new Date().toISOString(),
            __typename: "Comment",
          },
          __typename: "AddComment",
        },
      },
      update: (cache, payload) => {
        const {
          data: {
            addComment: {
              comment: { id: commentId },
            },
          },
        } = payload;
        const data: any = cache.readQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
        });

        const newComment = {
          ...comment,
          id: commentId,
          replies: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: "fake-user-id=",
            name: user.name,
            picture: user.picture,
            __typename: "User",
          },
        };
        const newData = {
          ...data,
          recording: {
            ...data.recording,
            comments: [...data.recording.comments, newComment],
          },
        };

        cache.writeQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
          data: newData,
        });
      },
    });
  };
}

export function useAddCommentReply() {
  const { user } = useAuth0();

  const [addCommentReply, { error }] = useMutation(
    gql`
      mutation AddCommentReply($input: AddCommentReplyInput!) {
        addCommentReply(input: $input) {
          success
          commentReply {
            id
          }
        }
      }
    `
  );

  if (error) {
    console.error("Apollo error while adding a comment:", error);
  }

  return (reply: any, recordingId: RecordingId) => {
    addCommentReply({
      variables: { input: reply },
      optimisticResponse: {
        addCommentReply: {
          success: true,
          commentReply: {
            id: new Date().toISOString(),
            __typename: "CommentReply",
          },
          __typename: "AddCommentReply",
        },
      },
      update: (cache, payload) => {
        const {
          data: {
            addCommentReply: { commentReply },
          },
        } = payload;
        const data: any = cache.readQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
        });
        const {
          viewer: {
            user: { id: userId },
          },
        }: any = cache.readQuery({
          query: GET_USER_ID,
        });

        const parentComment = data.recording.comments.find((r: any) => r.id === reply.commentId);
        const newReply = {
          id: commentReply.id,
          content: reply.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: userId,
            name: user.name,
            picture: user.picture,
            __typename: "User",
          },
          __typename: "CommentReply",
        };

        const newParentComment = {
          ...parentComment,
          replies: [...parentComment.replies, newReply],
        };
        const newData = {
          ...data,
          recording: {
            ...data.recording,
            comments: [
              ...data.recording.comments.filter((r: any) => r.id !== reply.commentId),
              newParentComment,
            ],
          },
        };

        cache.writeQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
          data: newData,
        });
      },
    });
  };
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

export function useDeleteComment() {
  const [deleteComment, { error }] = useMutation(
    gql`
      mutation DeleteComment($commentId: ID!) {
        deleteComment(input: { id: $commentId }) {
          success
        }
      }
    `
  );

  if (error) {
    console.error("Apollo error while deleting a comment:", error);
  }

  return (commentId: string, recordingId: RecordingId) => {
    deleteComment({
      variables: { commentId },
      optimisticResponse: {},
      update: cache => {
        const data: any = cache.readQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
        });

        const newData = {
          ...data,
          recording: {
            ...data.recording,
            comments: [...data.recording.comments.filter((c: any) => c.id !== commentId)],
          },
        };

        cache.writeQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
          data: newData,
        });
      },
    });
  };
}

export function useDeleteCommentReply() {
  const [deleteCommentReply, { error }] = useMutation(
    gql`
      mutation DeleteCommentReply($commentReplyId: ID!) {
        deleteCommentReply(input: { id: $commentReplyId }) {
          success
        }
      }
    `
  );

  if (error) {
    console.error("Apollo error while deleting a comment's reply:", error);
  }

  return (commentReplyId: string, recordingId: RecordingId) => {
    deleteCommentReply({
      variables: { commentReplyId },
      optimisticResponse: {},
      update: cache => {
        const data: any = cache.readQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
        });

        const parentComment = data.recording.comments.find((c: any) =>
          c.replies.find((r: any) => r.id === commentReplyId)
        );

        const newParentComment = {
          ...parentComment,
          replies: parentComment.replies.filter((r: any) => r.id !== commentReplyId),
        };
        const newData = {
          ...data,
          recording: {
            ...data.recording,
            comments: [
              ...data.recording.comments.filter((c: any) => c.id !== parentComment.id),
              newParentComment,
            ],
          },
        };

        cache.writeQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
          data: newData,
        });
      },
    });
  };
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
