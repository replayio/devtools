import { gql, useMutation } from "@apollo/client";
import useAuth0 from "ui/utils/useAuth0";
import { GET_USER_ID } from "ui/graphql/users";
import { GET_COMMENTS } from "ui/graphql/comments";
import { Reply } from "ui/state/comments";

import { useGetRecordingId } from "../recordings";
import { AddCommentReply, AddCommentReplyVariables } from "graphql/AddCommentReply";
import { GetComments } from "graphql/GetComments";

export default function useAddCommentReply() {
  const { user } = useAuth0();
  const recordingId = useGetRecordingId();

  const [addCommentReply, { error }] = useMutation<AddCommentReply, AddCommentReplyVariables>(
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

  return (reply: Reply) =>
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
            id: reply.id,
            __typename: "CommentReply",
          },
          __typename: "AddCommentReply",
        },
      },
      update: (cache, payload) => {
        const commentReply = payload?.data?.addCommentReply?.commentReply;
        const cachedata = cache.readQuery<GetComments>({
          query: GET_COMMENTS,
          variables: { recordingId },
        })!;
        const {
          viewer: {
            user: { id: userId },
          },
        }: any = cache.readQuery({
          query: GET_USER_ID,
        });

        const parentComment = (cachedata?.recording?.comments ?? []).find(
          (r: any) => r.id === reply.parentId
        );
        if (!parentComment) {
          return;
        }
        const newReply = {
          id: commentReply!.id,
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
              (r: any) => !r.isUnpublished && r.id !== commentReply!.id
            ),
            newReply,
          ],
        };
        const newData = {
          ...cachedata,
          recording: {
            ...cachedata.recording,
            comments: [
              ...(cachedata.recording?.comments ?? []).filter((r: any) => r.id !== reply.parentId),
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
}
