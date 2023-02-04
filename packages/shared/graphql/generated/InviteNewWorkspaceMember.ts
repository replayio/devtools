/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InviteNewWorkspaceMember
// ====================================================

export interface InviteNewWorkspaceMember_addWorkspaceMember {
  __typename: "AddWorkspaceMember";
  success: boolean | null;
}

export interface InviteNewWorkspaceMember {
  addWorkspaceMember: InviteNewWorkspaceMember_addWorkspaceMember;
}

export interface InviteNewWorkspaceMemberVariables {
  email: string;
  workspaceId: string;
  roles?: string[] | null;
}
