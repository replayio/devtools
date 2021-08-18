import { gql } from "@apollo/client";

export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    viewer {
      apiKeys {
        id
        createdAt
        label
        scopes
      }
      settings {
        showElements
        showReact
        enableTeams
        enableRepaint
      }
      defaultWorkspace {
        id
      }
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

export const GET_WORKSPACE_API_KEYS = gql`
  query GetWorkspaceApiKeys($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        apiKeys {
          id
          createdAt
          label
          scopes
        }
      }
    }
  }
`;

export const ADD_WORKSPACE_API_KEY = gql`
  mutation CreateWorkspaceAPIKey($workspaceId: ID!, $label: String!, $scopes: [String!]!) {
    createWorkspaceAPIKey(input: { workspaceId: $workspaceId, label: $label, scopes: $scopes }) {
      key {
        id
        label
      }
      keyValue
    }
  }
`;

export const DELETE_WORKSPACE_API_KEY = gql`
  mutation DeleteWorkspaceAPIKey($id: ID!) {
    deleteWorkspaceAPIKey(input: { id: $id }) {
      success
    }
  }
`;

export const UPDATE_WORKSPACE_MEMBER_ROLE = gql`
  mutation UpdateWorkspaceMemberRole($id: ID!, $roles: [String!]!) {
    updateWorkspaceMemberRole(input: { id: $id, roles: $roles }) {
      success
    }
  }
`;

export const GET_WORKSPACE_SUBSCRIPTION = gql`
  query GetWorkspaceSubscription($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        subscription {
          id
          createdAt
          effectiveFrom
          effectiveUntil
          status
          trialEnds
          plan {
            key
          }
        }
      }
    }
  }
`;
