/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateWorkspaceLogo
// ====================================================

export interface UpdateWorkspaceLogo_updateWorkspaceLogo {
  __typename: "UpdateWorkspaceLogo";
  success: boolean | null;
}

export interface UpdateWorkspaceLogo {
  updateWorkspaceLogo: UpdateWorkspaceLogo_updateWorkspaceLogo;
}

export interface UpdateWorkspaceLogoVariables {
  workspaceId: string;
  logo?: string | null;
}
