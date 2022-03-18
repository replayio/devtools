import { ApolloCache, gql, useMutation } from "@apollo/client";
import useAuth0 from "ui/utils/useAuth0";
import { GET_USER_ID } from "ui/graphql/users";
import { GET_COMMENTS, GqlComment, GqlGetComments } from "ui/graphql/comments";
import { Comment, Reply } from "ui/state/comments";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { useGetRecordingId } from "../recordings";

type AddCommentReplyData = {
  addCommentReply: {
    __typename: "AddCommentReply";
    success: true;
    commentReply: {
      id: typeof PENDING_COMMENT_ID;
      __typename: "CommentReply";
    };
  };
};

type AddCommentReplyVariables = {
  input: {
    commentId: Comment["id"];
    content: string;
  };
};

export default function useAddCommentReply() {
  const { user } = useAuth0();
  const recordingId = useGetRecordingId();

  const [addCommentReply, { error }] = useMutation<
    AddCommentReplyData,
    AddCommentReplyVariables,
    any,
    ApolloCache<GqlGetComments>
  >(
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
      update: (cache, { data }) => {
        const commentReply = data!.addCommentReply.commentReply;
        const getCommentsCache: GqlGetComments = cache.readQuery({
          query: GET_COMMENTS,
          variables: { recordingId },
        })!;
        const userId = (
          cache.readQuery({
            query: GET_USER_ID,
          }) as any
        ).viewer.user.id;

        const parentComment = getCommentsCache.recording.comments.find(
          (r: any) => r.id === reply.parentId
        );
        if (!parentComment) {
          return;
        }
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
            ...(parentComment.replies || []).filter(
              (r: any) => r.id !== PENDING_COMMENT_ID && r.id !== commentReply.id
            ),
            newReply,
          ],
        };

        cache.writeQuery<GqlGetComments>({
          query: GET_COMMENTS,
          variables: { recordingId },
          data: {
            ...getCommentsCache,
            recording: {
              ...getCommentsCache.recording,
              comments: [
                ...getCommentsCache.recording.comments.filter((r: any) => r.id !== reply.parentId),
                newParentComment,
              ],
            },
          },
        });
      },
    });
  };
}
