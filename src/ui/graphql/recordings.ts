import { gql } from "@apollo/client";

export const IS_RECORDING_ACCESSIBLE = gql`
  query IsRecordingAccessible($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      isInitialized
    }
  }
`;

export const GET_RECORDING_USER_ID = gql`
  query GetRecordingUserId($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      owner {
        id
      }
    }
  }
`;

export const GET_RECORDING = gql`
  query GetRecording($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      url
      title
      duration
      createdAt
      private
      isInitialized
      ownerNeedsInvite
      owner {
        id
        name
        picture
        internal
      }
      workspace {
        id
        name
      }
      collaborators {
        edges {
          node {
            ... on RecordingUserCollaborator {
              id
              user {
                id
              }
            }
          }
        }
      }
    }
  }
`;
