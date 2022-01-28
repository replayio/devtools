import { gql } from "@apollo/client";

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
      userRole
      operations
      comments {
        id
      }
      owner {
        id
        name
        picture
        internal
      }
      workspace {
        id
        name
        subscription {
          status
          trialEnds
          effectiveUntil
        }
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
      collaboratorRequests {
        edges {
          node {
            ... on RecordingCollaboratorRequest {
              uuid
              id
              user {
                name
                picture
              }
            }
          }
        }
      }
    }
  }
`;
