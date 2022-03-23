import { RecordingId } from "@recordreplay/protocol";
import { gql, useMutation } from "@apollo/client";
import { GET_COMMENTS } from "ui/graphql/comments";
import { DeleteComment, DeleteCommentVariables } from "graphql/DeleteComment";

export default function useDeleteComment() {
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
}
