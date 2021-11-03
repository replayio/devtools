import { gql } from "@apollo/client";

export const UPDATE_USER_NAGS = gql`
  mutation UpdateUserNags($newNags: [String!]!) {
    updateUserNags(input: { nags: $newNags }) {
      success
    }
  }
`;

export const GET_USER_INFO = gql`
  query GetUser {
    viewer {
      user {
        id
      }
      email
      internal
      nags
      acceptedTOSVersion
      unsubscribedEmailTypes
    }
  }
`;

export const GET_USER_ID = gql`
  query GetUserId {
    viewer {
      user {
        id
      }
    }
  }
`;
