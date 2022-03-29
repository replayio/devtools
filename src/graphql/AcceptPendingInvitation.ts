/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AcceptPendingInvitation
// ====================================================

export interface AcceptPendingInvitation_acceptWorkspaceMembership {
  __typename: "AcceptWorkspaceMembership";
  success: boolean | null;
}

export interface AcceptPendingInvitation {
  acceptWorkspaceMembership: AcceptPendingInvitation_acceptWorkspaceMembership;
}

export interface AcceptPendingInvitationVariables {
  workspaceId: string;
}
