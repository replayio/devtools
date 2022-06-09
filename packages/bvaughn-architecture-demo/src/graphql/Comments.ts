import { RecordingId } from "@replayio/protocol";

import { GetComments } from "./generated/GetComments";
import { GraphQLClientInterface } from "./GraphQLClient";
import { Comment, CommentPosition } from "./types";

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
        primaryLabel
        secondaryLabel
        createdAt
        updatedAt
        hasFrames
        sourceLocation
        time
        point
        position
        networkRequestId
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
  mutation UpdateCommentContent($newContent: String!, $newIsPublished: Boolean!, $commentId: ID!, $newPosition: JSONObject) {
    updateComment(input: { id: $commentId, content: $newContent, isPublished: $newIsPublished, position: $newPosition }) {
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

  // TODO Re-think these type differences; it would be nice for the client and GraphQL to use the same types.
  // @ts-ignore
  return comments.map(comment => {
    return {
      ...comment,
      content: tryToParse(comment.content),
      replies: comment.replies.map(reply => {
        return {
          ...reply,
          content: tryToParse(reply.content),
          hasFrames: comment.hasFrames,
          sourceLocation: comment.sourceLocation,
          time: comment.time,
          parentId: comment.id,
          point: comment.point,
          position: comment.position,
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
  newIsPublished: boolean,
  newPosition: CommentPosition | null
) {
  await graphQLClient.send<GetComments>(
    {
      operationName: "UpdateCommentContent",
      query: UpdateCommentMutation,
      variables: { newContent, newIsPublished, newPosition, commentId },
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

// HACK: This is the inverse of tryToParse() in <TipTapEditor>
// For the purposes of this demo, comment contents are plain text.
function tryToParse(content: string): string {
  try {
    content = JSON.parse(content)
      .content.map((paragraph: any) => paragraph.content.map((block: any) => block.text).join(""))
      .join("");
  } catch (error) {}

  return content;
}
