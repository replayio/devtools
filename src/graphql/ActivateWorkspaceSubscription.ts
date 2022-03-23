/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ActivateWorkspaceSubscription
// ====================================================

export interface ActivateWorkspaceSubscription_setWorkspaceDefaultPaymentMethod {
  __typename: "SetWorkspaceDefaultPaymentMethod";
  success: boolean | null;
}

export interface ActivateWorkspaceSubscription_activateWorkspaceSubscription_subscription {
  __typename: "WorkspaceSubscription";
  effectiveUntil: any | null;
  status: string | null;
}

export interface ActivateWorkspaceSubscription_activateWorkspaceSubscription {
  __typename: "ActivateWorkspaceSubscription";
  success: boolean | null;
  subscription: ActivateWorkspaceSubscription_activateWorkspaceSubscription_subscription | null;
}

export interface ActivateWorkspaceSubscription {
  setWorkspaceDefaultPaymentMethod: ActivateWorkspaceSubscription_setWorkspaceDefaultPaymentMethod;
  activateWorkspaceSubscription: ActivateWorkspaceSubscription_activateWorkspaceSubscription;
}

export interface ActivateWorkspaceSubscriptionVariables {
  workspaceId: string;
  planKey: string;
  paymentMethodBillingId: string;
}
