/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { DeletePointInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: DeletePoint
// ====================================================

export interface DeletePoint_deletePoint {
  __typename: "DeletePoint";
  success: boolean | null;
}

export interface DeletePoint {
  deletePoint: DeletePoint_deletePoint;
}

export interface DeletePointVariables {
  input: DeletePointInput;
}
