/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetConnection
// ====================================================

export interface GetConnection_auth {
  __typename: "Authentication";
  connection: string | null;
}

export interface GetConnection {
  auth: GetConnection_auth | null;
}

export interface GetConnectionVariables {
  email: string;
}
