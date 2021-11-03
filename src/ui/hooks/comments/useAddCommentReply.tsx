import { gql, useMutation } from "@apollo/client";
import useAuth0 from "ui/utils/useAuth0";
import { GET_USER_ID } from "ui/graphql/users";
import { GET_COMMENTS } from "ui/graphql/comments";
import { Reply } from "ui/state/comments";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { useGetRecordingId } from "../recordings";

export default function useAddCommentReply() {
  const { user } = useAuth0();
  const recordingId = useGetRecordingId();

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

  return (reply: Reply) => {
    addCommentReply({
      variables: {
        input: {
          commentId: reply.parentId,
          content: reply.content,
        },
      },
      optimisticResponse: {
        addCommentReply: {
          success: true,
          commentReply: {
            id: PENDING_COMMENT_ID,
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

        const parentComment = data.recording.comments.find((r: any) => r.id === reply.parentId);
        const newReply = {
          id: commentReply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
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
          replies: [
            ...parentComment.replies.filter(
              (r: any) => r.id !== PENDING_COMMENT_ID && r.id !== commentReply.id
            ),
            newReply,
          ],
        };
        const newData = {
          ...data,
          recording: {
            ...data.recording,
            comments: [
              ...data.recording.comments.filter((r: any) => r.id !== reply.parentId),
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
