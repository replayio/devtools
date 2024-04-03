import { gql } from "@apollo/client";

export const GET_RECORDING_ROOT_CAUSE_ANALYSIS_SUMMARY = gql`
  query GetRecordingRootCauseAnalysis($recordingId: uuid!) {
    root_cause_analysis_results(where: { recording_id: { _eq: $recordingId } }) {
      created_at
      recording_id
      resultSummary: result(path: "$.result")
      resultSkipReason: result(path: "$.skipReason")
      result
      version
    }
  }
`;

export const GET_RECORDING_ROOT_CAUSE_ANALYSIS_FULL = gql`
  query GetRecordingRootCauseAnalysis($recordingId: uuid!) {
    root_cause_analysis_results(where: { recording_id: { _eq: $recordingId } }) {
      created_at
      recording_id
      updated_at
      result
      version
    }
  }
`;
