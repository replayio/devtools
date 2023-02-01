/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DismissNag
// ====================================================

export interface DismissNag_dismissNag {
  __typename: "DismissNag";
  success: boolean | null;
}

export interface DismissNag {
  dismissNag: DismissNag_dismissNag;
}

export interface DismissNagVariables {
  nag: string;
}
