import { gql } from "@apollo/client";

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
          paymentMethods {
            id
            type
            default
            card {
              brand
              last4
            }
          }
          plan {
            key
          }
        }
      }
    }
  }
`;

export const PREPARE_WORKSPACE_PAYMENT_METHOD = gql`
  mutation PrepareWorkspacePaymentMethod($workspaceId: ID!) {
    prepareWorkspacePaymentMethod(input: { workspaceId: $workspaceId }) {
      success
      paymentSecret
    }
  }
`;

export const SET_WORKSPACE_DEFAULT_PAYMENT_METHOD = gql`
  mutation SetWorkspaceDefaultPaymentMethod($workspaceId: ID!, $paymentMethodId: ID!) {
    setWorkspaceDefaultPaymentMethod(
      input: { workspaceId: $workspaceId, paymentMethodId: $paymentMethodId }
    ) {
      success
    }
  }
`;

export const CANCEL_WORKSPACE_SUBSCRIPTION = gql`
  mutation CancelWorkspaceSubscription($workspaceId: ID!) {
    cancelWorkspaceSubscription(input: { workspaceId: $workspaceId }) {
      success
      subscription {
        effectiveUntil
        status
      }
    }
  }
`;
