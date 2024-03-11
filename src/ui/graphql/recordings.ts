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
      resolution
      metadata
      isTest
      isProcessed
      isInTestWorkspace
      comments {
        id
        isPublished
        content
        createdAt
        updatedAt
        hasFrames
        time
        point
        user {
          id
          name
          picture
        }
        replies {
          id
          isPublished
          content
          createdAt
          updatedAt
          user {
            id
            name
            picture
          }
        }
      }
      activeSessions {
        id
        user {
          id
          name
          picture
        }
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
        hasPaymentMethod
        isTest
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

export const SUBSCRIBE_RECORDING = gql`
  subscription SubscribeRecording($recordingId: UUID!) {
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
      resolution
      metadata
      comments {
        id
        isPublished
        content
        createdAt
        updatedAt
        hasFrames
        time
        point
        user {
          id
          name
          picture
        }
        replies {
          id
          isPublished
          content
          createdAt
          updatedAt
          user {
            id
            name
            picture
          }
        }
      }
      activeSessions {
        id
        user {
          id
          name
          picture
        }
      }
    }
  }
`;
