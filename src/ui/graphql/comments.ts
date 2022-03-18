import { gql } from "@apollo/client";
import { Comment, Reply } from "ui/state/comments";
import { Recording, User } from "ui/types";

export const GET_COMMENTS = gql`
  query GetComments($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      comments {
        id
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
          name
          picture
        }
        replies {
          id
          content
          createdAt
          updatedAt
          user {
            id
            name
            picture
          }
        }
      }
    }
  }
`;

export const GET_COMMENTS_TIME = gql`
  query GetCommentsTime($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      comments {
        id
        hasFrames
        point
        time
      }
    }
  }
`;

type UndefinedToNull<T> = T extends infer NonUndefined | undefined ? NonUndefined | null : T;

export type U2N<T extends Record<any, any>> = {
  [K in keyof T]-?: UndefinedToNull<T[K]>;
};

export type GqlUser = {
  __typename: "User";
} & Omit<User, "internal">;

export type GqlCommentReply = {
  __typename: "CommentReply";
} & U2N<Reply>;

export type GqlComment = {
  __typename: "Comment";
} & U2N<Omit<Comment, "user">> & {
    user: GqlUser;
  };

export type GqlGetComments = {
  recording: {
    __typename: "Recording";
    uuid: Recording["id"];
    comments: GqlComment[];
  };
};
