import { RecordingId } from "@replayio/protocol";

import { GetComments } from "./generated/GetComments";
import { AddCommentInput } from "./generated/globalTypes";
import { GraphQLClientInterface } from "./GraphQLClient";
import { Comment } from "./types";

const AddCommentMutation = `
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) {
      success
      comment {
        id
      }
    }
  }
`;

const AddCommentReplyMutation = `
  mutation AddCommentReply($input: AddCommentReplyInput!) {
    addCommentReply(input: $input) {
      success
      commentReply {
        id
      }
    }
  }
`;

const DeleteCommentMutation = `
  mutation DeleteComment($commentId: ID!) {
    deleteComment(input: { id: $commentId }) {
      success
    }
  }
`;

const DeleteCommentReplyMutation = `
  mutation DeleteCommentReply($replyId: ID!) {
    deleteCommentReply(input: { id: $replyId }) {
      success
    }
  }
`;

const GetCommentsQuery = `
  query GetComments($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      comments {
        id
        isPublished
        content
        createdAt
        updatedAt
        hasFrames
        time
        point
        type
        typeData
        user {
          id
          internal
          name
          picture
          __typename
        }
        replies {
          id
          isPublished
          content
          createdAt
          updatedAt
          user {
            id
            name
            picture
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

const UpdateCommentMutation = `
  mutation UpdateCommentContent($newContent: String!, $newIsPublished: Boolean!, $commentId: ID!) {
    updateComment(input: { id: $commentId, content: $newContent, isPublished: $newIsPublished }) {
      success
    }
  }
`;

const UpdateCommentReplyMutation = `
  mutation UpdateCommentReplyContent($newContent: String!, $newIsPublished: Boolean!, $replyId: ID!) {
    updateCommentReply(input: { id: $replyId, content: $newContent, isPublished: $newIsPublished }) {
      success
    }
  }
`;

export async function addComment(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  recordingId: RecordingId,
  config: Partial<
    Omit<
      AddCommentInput,
      "networkRequestId" | "position" | "primaryLabel" | "secondaryLabel" | "sourceLocation"
    >
  >
) {
  await graphQLClient.send(
    {
      operationName: "AddComment",
      query: AddCommentMutation,
      variables: {
        input: {
          ...config,
          recordingId,
        },
      },
    },
    accessToken
  );
}

export async function addCommentReply(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  parentId: string,
  content: string,
  isPublished: boolean
) {
  await graphQLClient.send(
    {
      operationName: "AddCommentReply",
      query: AddCommentReplyMutation,
      variables: {
        input: {
          commentId: parentId,
          content,
          isPublished,
        },
      },
    },
    accessToken
  );
}

export async function deleteComment(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  commentId: string
) {
  await graphQLClient.send(
    {
      operationName: "DeleteComment",
      query: DeleteCommentMutation,
      variables: { commentId },
    },
    accessToken
  );
}

export async function deleteCommentReply(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  replyId: string
) {
  await graphQLClient.send(
    {
      operationName: "DeleteCommentReply",
      query: DeleteCommentReplyMutation,
      variables: { replyId },
    },
    accessToken
  );
}

export async function getComments(
  graphQLClient: GraphQLClientInterface,
  recordingId: RecordingId,
  accessToken: string | null
): Promise<Comment[]> {
  const response = await graphQLClient.send<GetComments>(
    {
      operationName: "GetComments",
      query: GetCommentsQuery,
      variables: { recordingId },
    },
    accessToken
  );

  const comments = response?.recording?.comments ?? [];

  // @ts-ignore
  return comments.map(comment => {
    return {
      ...comment,
      content: comment.content,
      replies: comment.replies.map(reply => {
        return {
          ...reply,
          content: reply.content,
          hasFrames: comment.hasFrames,
          time: comment.time,
          parentId: comment.id,
          point: comment.point,
        };
      }),
    };
  });
}

export async function updateComment(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  commentId: string,
  newContent: string,
  newIsPublished: boolean
) {
  await graphQLClient.send<GetComments>(
    {
      operationName: "UpdateCommentContent",
      query: UpdateCommentMutation,
      variables: { newContent, newIsPublished, commentId },
    },
    accessToken
  );
}

export async function updateCommentReply(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  replyId: string,
  newContent: string,
  newIsPublished: boolean
) {
  await graphQLClient.send<GetComments>(
    {
      operationName: "UpdateCommentReplyContent",
      query: UpdateCommentReplyMutation,
      variables: { newContent, newIsPublished, replyId },
    },
    accessToken
  );
}
