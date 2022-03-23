/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateUserAPIKey
// ====================================================

export interface CreateUserAPIKey_createUserAPIKey_key {
  __typename: "WorkspaceAPIKey";
  id: string;
  label: string;
}

export interface CreateUserAPIKey_createUserAPIKey {
  __typename: "CreateUserAPIKey";
  key: CreateUserAPIKey_createUserAPIKey_key;
  keyValue: string;
}

export interface CreateUserAPIKey {
  createUserAPIKey: CreateUserAPIKey_createUserAPIKey;
}

export interface CreateUserAPIKeyVariables {
  label: string;
  scopes: string[];
}
