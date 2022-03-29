import { gql, useMutation } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { Comment, CommentPosition, ROOT_COMMENT_ID } from "ui/state/comments";
import { GET_COMMENTS_TIME } from "ui/graphql/comments";
import {
  UpdateCommentReplyContent,
  UpdateCommentReplyContentVariables,
} from "graphql/UpdateCommentReplyContent";
import { UpdateCommentContent, UpdateCommentContentVariables } from "graphql/UpdateCommentContent";

function _useUpdateComment() {
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

  return (commentId: string, newContent: string, position: CommentPosition | null) => {
    updateCommentContent({
      variables: { commentId, newContent, position },
      optimisticResponse: {
        updateComment: {
          success: true,
          __typename: "UpdateComment",
        },
      },
      update: cache => {
        cache.modify({
          id: cache.identify({ id: commentId, __typename: "Comment" }),
          fields: {
            content: () => newContent,
            position: () => position,
          },
        });
      },
    });
  };
}

function _useUpdateCommentReply() {
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

  return (commentId: string, newContent: string) => {
    updateCommentReplyContent({
      variables: { commentId, newContent },
      optimisticResponse: {
        updateCommentReply: {
          success: true,
          __typename: "UpdateCommentReply",
        },
      },
      update: cache => {
        cache.modify({
          id: cache.identify({ id: commentId, __typename: "CommentReply" }),
          fields: { content: () => newContent },
        });
      },
    });
  };
}

// a unified handler for updating comments and/or replies
export const useUpdateComment = (): ((
  comment: Comment,
  newContent: string,
  position?: CommentPosition | null
) => void) => {
  const updateComment = _useUpdateComment();
  const updateCommentReply = _useUpdateCommentReply();

  return (comment, newContent, position) => {
    // top-level comment
    if (comment.parentId === ROOT_COMMENT_ID) {
      updateComment(comment.id, newContent, position ?? null);
      // reply
    } else {
      updateCommentReply(comment.id, newContent);
    }
  };
};

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
