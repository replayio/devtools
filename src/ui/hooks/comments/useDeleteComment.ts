import { RecordingId } from "@recordreplay/protocol";
import { gql, useMutation } from "@apollo/client";
import { GET_COMMENTS } from "ui/graphql/comments";
import { DeleteComment, DeleteCommentVariables } from "graphql/DeleteComment";
import { DeleteCommentReply, DeleteCommentReplyVariables } from "graphql/DeleteCommentReply";
import { Comment, ROOT_COMMENT_ID } from "ui/state/comments";

const _useDeleteComment = () => {
  const [deleteComment, { error }] = useMutation<DeleteComment, DeleteCommentVariables>(
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
      optimisticResponse: { deleteComment: { success: true, __typename: "DeleteComment" } },
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
};

const _useDeleteCommentReply = () => {
  const [deleteCommentReply, { error }] = useMutation<
    DeleteCommentReply,
    DeleteCommentReplyVariables
  >(
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
      optimisticResponse: {
        deleteCommentReply: { success: true, __typename: "DeleteCommentReply" },
      },
      update: cache => {
        const data: any = cache.readQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
        });

        const parentComment = data.recording.comments.find((c: any) =>
          c.replies.find((r: any) => r.id === commentReplyId)
        );
        if (!parentComment) {
          return;
        }

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
};

// a unified handler for deleting comments and/or replies
export const useDeleteComment = (): ((comment: Comment, recordingId: RecordingId) => void) => {
  const deleteComment = _useDeleteComment();
  const deleteCommentReply = _useDeleteCommentReply();

  return (comment, recordingId) => {
    // top-level comment
    if (comment.parentId === ROOT_COMMENT_ID) {
      deleteComment(comment.id, recordingId);
      // reply
    } else {
      deleteCommentReply(comment.id, recordingId);
    }
  };
};
