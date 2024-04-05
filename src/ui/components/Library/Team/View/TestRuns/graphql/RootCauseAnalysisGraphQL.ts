import { gql } from "@apollo/client";

export const GET_RECORDING_ROOT_CAUSE_ANALYSIS = gql`
  query GetRecordingRootCauseAnalysisSummary($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      rootCauseAnalysis {
        id
        version
        result
      }
    }
  }
`;
