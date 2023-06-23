import { gql } from "@apollo/client";

export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    viewer {
      apiKeys {
        id
        createdAt
        label
        scopes
        recordingCount
        maxRecordings
      }
      preferences
      defaultWorkspace {
        id
      }
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

export const ADD_USER_API_KEY = gql`
  mutation CreateUserAPIKey($label: String!, $scopes: [String!]!) {
    createUserAPIKey(input: { label: $label, scopes: $scopes }) {
      key {
        id
        label
      }
      keyValue
    }
  }
`;

export const DELETE_USER_API_KEY = gql`
  mutation DeleteUserAPIKey($id: ID!) {
    deleteUserAPIKey(input: { id: $id }) {
      success
    }
  }
`;
