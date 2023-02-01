/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteWorkspacePaymentMethod
// ====================================================

export interface DeleteWorkspacePaymentMethod_deleteWorkspacePaymentMethod {
  __typename: "DeleteWorkspacePaymentMethod";
  success: boolean | null;
}

export interface DeleteWorkspacePaymentMethod {
  deleteWorkspacePaymentMethod: DeleteWorkspacePaymentMethod_deleteWorkspacePaymentMethod;
}

export interface DeleteWorkspacePaymentMethodVariables {
  workspaceId: string;
  paymentMethodId: string;
}
