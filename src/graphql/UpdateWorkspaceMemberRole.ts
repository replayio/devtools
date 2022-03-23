/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateWorkspaceMemberRole
// ====================================================

export interface UpdateWorkspaceMemberRole_updateWorkspaceMemberRole {
  __typename: "UpdateWorkspaceMemberRole";
  success: boolean | null;
}

export interface UpdateWorkspaceMemberRole {
  updateWorkspaceMemberRole: UpdateWorkspaceMemberRole_updateWorkspaceMemberRole;
}

export interface UpdateWorkspaceMemberRoleVariables {
  id: string;
  roles: string[];
}
