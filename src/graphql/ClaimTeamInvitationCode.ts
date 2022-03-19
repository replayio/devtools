/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: ClaimTeamInvitationCode
// ====================================================

export interface ClaimTeamInvitationCode_claimTeamInvitationCode {
  __typename: "ClaimTeamInvitationCode";
  success: boolean | null;
}

export interface ClaimTeamInvitationCode {
  claimTeamInvitationCode: ClaimTeamInvitationCode_claimTeamInvitationCode;
}

export interface ClaimTeamInvitationCodeVariables {
  code: string;
}
