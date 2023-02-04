/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AcceptTOS
// ====================================================

export interface AcceptTOS_acceptTermsOfService {
  __typename: "AcceptTermsOfService";
  success: boolean | null;
}

export interface AcceptTOS {
  acceptTermsOfService: AcceptTOS_acceptTermsOfService;
}

export interface AcceptTOSVariables {
  version: number;
}
