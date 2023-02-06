/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AddPointInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: AddPoint
// ====================================================

export interface AddPoint_addPoint {
  __typename: "AddPoint";
  success: boolean | null;
}

export interface AddPoint {
  addPoint: AddPoint_addPoint;
}

export interface AddPointVariables {
  input: AddPointInput;
}
