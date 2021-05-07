import { RecordingId } from "@recordreplay/protocol";
import { gql, useMutation } from "@apollo/client";
import useAuth0 from "ui/utils/useAuth0";
import { GET_COMMENTS } from "./comments";

export default function useAddComment() {
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
      update: (cache, { data: { addComment } }) => {
        const {
          comment: { id: commentId },
        } = addComment;
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
