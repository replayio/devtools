/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: PrepareWorkspacePaymentMethod
// ====================================================

export interface PrepareWorkspacePaymentMethod_prepareWorkspacePaymentMethod {
  __typename: "PrepareWorkspacePaymentMethod";
  success: boolean | null;
  paymentSecret: string | null;
}

export interface PrepareWorkspacePaymentMethod {
  prepareWorkspacePaymentMethod: PrepareWorkspacePaymentMethod_prepareWorkspacePaymentMethod;
}

export interface PrepareWorkspacePaymentMethodVariables {
  workspaceId: string;
}
