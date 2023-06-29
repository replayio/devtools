import { gql } from "@apollo/client";

export const GET_USER_PREFERENCES = gql`
  query GetUserPreferences {
    viewer {
      preferences
    }
  }
`;

export const UPDATE_USER_PREFERENCES = gql`
  mutation UpdateUserPreferences($preferences: JSONObject!) {
    updateUserPreferences(input: { preferences: $preferences }) {
      success
    }
  }
`;
