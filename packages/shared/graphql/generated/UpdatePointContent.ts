/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UpdatePointInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: UpdatePointContent
// ====================================================

export interface UpdatePointContent_updatePoint {
  __typename: "UpdatePoint";
  success: boolean | null;
}

export interface UpdatePointContent {
  updatePoint: UpdatePointContent_updatePoint;
}

export interface UpdatePointContentVariables {
  input: UpdatePointInput;
}
