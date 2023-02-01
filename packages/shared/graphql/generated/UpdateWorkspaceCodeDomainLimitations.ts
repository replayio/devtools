/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateWorkspaceCodeDomainLimitations
// ====================================================

export interface UpdateWorkspaceCodeDomainLimitations_updateWorkspaceCodeDomainLimitations {
  __typename: "UpdateWorkspaceCodeDomainLimitations";
  success: boolean | null;
}

export interface UpdateWorkspaceCodeDomainLimitations {
  updateWorkspaceCodeDomainLimitations: UpdateWorkspaceCodeDomainLimitations_updateWorkspaceCodeDomainLimitations;
}

export interface UpdateWorkspaceCodeDomainLimitationsVariables {
  workspaceId: string;
  isLimited: boolean;
}
