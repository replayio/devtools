/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CancelWorkspaceSubscription
// ====================================================

export interface CancelWorkspaceSubscription_cancelWorkspaceSubscription_subscription {
  __typename: "WorkspaceSubscription";
  effectiveUntil: any | null;
  status: string | null;
}

export interface CancelWorkspaceSubscription_cancelWorkspaceSubscription {
  __typename: "CancelWorkspaceSubscription";
  success: boolean | null;
  subscription: CancelWorkspaceSubscription_cancelWorkspaceSubscription_subscription | null;
}

export interface CancelWorkspaceSubscription {
  cancelWorkspaceSubscription: CancelWorkspaceSubscription_cancelWorkspaceSubscription;
}

export interface CancelWorkspaceSubscriptionVariables {
  workspaceId: string;
}
