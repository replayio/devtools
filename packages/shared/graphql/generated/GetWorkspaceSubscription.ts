/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetWorkspaceSubscription
// ====================================================

export interface GetWorkspaceSubscription_node_Recording {
  __typename: "Recording";
}

export interface GetWorkspaceSubscription_node_Workspace_subscription_paymentMethods_card {
  __typename: "PaymentMethodCard";
  brand: string;
  last4: string;
}

export interface GetWorkspaceSubscription_node_Workspace_subscription_paymentMethods {
  __typename: "PaymentMethod";
  id: string;
  type: string;
  default: boolean;
  card: GetWorkspaceSubscription_node_Workspace_subscription_paymentMethods_card;
}

export interface GetWorkspaceSubscription_node_Workspace_subscription_plan {
  __typename: "Plan";
  key: string;
}

export interface GetWorkspaceSubscription_node_Workspace_subscription {
  __typename: "WorkspaceSubscription";
  id: string;
  createdAt: any;
  effectiveFrom: any | null;
  effectiveUntil: any | null;
  status: string | null;
  trialEnds: any | null;
  seatCount: number;
  paymentMethods: GetWorkspaceSubscription_node_Workspace_subscription_paymentMethods[] | null;
  plan: GetWorkspaceSubscription_node_Workspace_subscription_plan | null;
}

export interface GetWorkspaceSubscription_node_Workspace {
  __typename: "Workspace";
  subscription: GetWorkspaceSubscription_node_Workspace_subscription | null;
}

export type GetWorkspaceSubscription_node = GetWorkspaceSubscription_node_Recording | GetWorkspaceSubscription_node_Workspace;

export interface GetWorkspaceSubscription {
  node: GetWorkspaceSubscription_node | null;
}

export interface GetWorkspaceSubscriptionVariables {
  workspaceId: string;
}
