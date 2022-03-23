/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: SetWorkspaceDefaultPaymentMethod
// ====================================================

export interface SetWorkspaceDefaultPaymentMethod_setWorkspaceDefaultPaymentMethod {
  __typename: "SetWorkspaceDefaultPaymentMethod";
  success: boolean | null;
}

export interface SetWorkspaceDefaultPaymentMethod {
  setWorkspaceDefaultPaymentMethod: SetWorkspaceDefaultPaymentMethod_setWorkspaceDefaultPaymentMethod;
}

export interface SetWorkspaceDefaultPaymentMethodVariables {
  workspaceId: string;
  paymentMethodId: string;
}
