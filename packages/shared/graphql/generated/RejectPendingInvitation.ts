/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RejectPendingInvitation
// ====================================================

export interface RejectPendingInvitation_rejectWorkspaceMembership {
  __typename: "RejectWorkspaceMembership";
  success: boolean | null;
}

export interface RejectPendingInvitation {
  rejectWorkspaceMembership: RejectPendingInvitation_rejectWorkspaceMembership;
}

export interface RejectPendingInvitationVariables {
  workspaceId: string;
}
