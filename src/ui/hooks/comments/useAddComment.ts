import { gql, useMutation } from "@apollo/client";
import useAuth0 from "ui/utils/useAuth0";
import { GET_USER_ID } from "ui/graphql/users";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { useGetRecordingId } from "../recordings";
import { AddCommentReply, AddCommentReplyVariables } from "graphql/AddCommentReply";
import { GetComments } from "graphql/GetComments";
import { Comment, ROOT_COMMENT_ID } from "ui/state/comments";
import { GET_COMMENTS } from "ui/graphql/comments";
import { trackEvent } from "ui/utils/telemetry";
import omit from "lodash/omit";
import { AddComment, AddCommentVariables } from "graphql/AddComment";

const _useAddComment = () => {
  const [addComment, { error }] = useMutation<AddComment, AddCommentVariables>(
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

  return (comment: Comment) => {
    trackEvent("comments.create");

    addComment({
      variables: {
        input: {
          ...omit(comment, ["id", "createdAt", "updatedAt", "replies", "user"]),
          recordingId: comment.recordingId,
        },
      },
      optimisticResponse: {
        addComment: {
          success: true,
          comment: {
            id: comment["id"],
            __typename: "Comment",
          },
          __typename: "AddComment",
        },
      },
      update: (cache, { data }) => {
        const commentId = data?.addComment?.comment?.id;
        const cacheData = cache.readQuery<GetComments>({
          query: GET_COMMENTS,
          variables: { recordingId: comment.recordingId },
        })!;
        const {
          viewer: {
            user: { id: userId },
          },
        }: any = cache.readQuery({
          query: GET_USER_ID,
        });

        const newComment = {
          ...comment,
          id: commentId,
          primaryLabel: comment.primaryLabel || null,
          secondaryLabel: comment.secondaryLabel || null,
          user: {
            id: userId,
            name: comment.user.name,
            picture: comment.user.picture,
            __typename: "User",
          },
          __typename: "Comment",
        };
        const newData = {
          ...cacheData,
          recording: {
            ...cacheData.recording,
            comments: [
              ...(cacheData.recording?.comments ?? []).filter(c => c.id !== commentId),
              newComment,
            ],
          },
        };

        cache.writeQuery({
          query: GET_COMMENTS,
          variables: { recordingId: comment.recordingId },
          data: newData,
        });
      },
    });
  };
};

const _useAddCommentReply = () => {
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

  return (reply: Comment) => {
    addCommentReply({
      variables: {
        input: {
          commentId: reply.parentId!,
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
              (r: any) => r.id !== PENDING_COMMENT_ID && r.id !== commentReply!.id
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
  };
};

// a unified handler for adding comments and/or replies
export const useAddComment = (): ((comment: Comment) => void) => {
  const addComment = _useAddComment();
  const addCommentReply = _useAddCommentReply();

  return comment => {
    // top-level comment
    if (comment.parentId === ROOT_COMMENT_ID) {
      addComment(comment);
      // reply
    } else {
      addCommentReply(comment);
    }
  };
};
