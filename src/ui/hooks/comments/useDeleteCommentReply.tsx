import { gql, useMutation } from "@apollo/client";
import { RecordingId } from "@recordreplay/protocol";
import { DeleteCommentReply, DeleteCommentReplyVariables } from "graphql/DeleteCommentReply";
import { GET_COMMENTS } from "ui/graphql/comments";

export default function useDeleteCommentReply() {
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
      optimisticResponse: {
        deleteCommentReply: { __typename: "DeleteCommentReply", success: true },
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
          data: newData,
          query: GET_COMMENTS,
          variables: { recordingId },
        });
      },
      variables: { commentReplyId },
    });
  };
}
