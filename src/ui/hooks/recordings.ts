import { RecordingId } from "@recordreplay/protocol";
import { ApolloError, gql, useQuery, useMutation } from "@apollo/client";
import { Recording } from "ui/types";
import { WorkspaceId } from "ui/state/app";
import { CollaboratorDbData } from "ui/components/shared/SharingModal/CollaboratorsList";
import { useGetUserId } from "./users";

function isTest() {
  return new URL(window.location.href).searchParams.get("test");
}

export function useGetRecording(
  recordingId: RecordingId | null
): { recording: Recording | undefined; isAuthorized: boolean; loading: boolean } {
  const { data, error, loading } = useQuery(
    gql`
      query GetRecording($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          url
          title
          duration
          createdAt
          private
          isInitialized
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
        }
      }
    `,
    {
      variables: { recordingId },
      skip: !recordingId,
    }
  );

  if (error) {
    console.error("Apollo error while getting the recording", error);
  }

  const recording = convertRecording(data?.recording);
  // Tests don't have an associated user so we just let it bypass the check here.
  const isAuthorized = isTest() || recording;

  return { recording, isAuthorized: !!isAuthorized, loading };
}

function convertRecording(rec: any): Recording | undefined {
  if (!rec) {
    return undefined;
  }

  return {
    id: rec.uuid,
    user: rec.owner,
    userId: rec.owner?.id,
    url: rec.url,
    title: rec.title,
    duration: rec.duration,
    private: rec.private,
    isInitialized: rec.isInitialized,
    date: rec.createdAt,
  };
}

export function useGetRecordingPhoto(
  recordingId: RecordingId
): {
  error: ApolloError | undefined;
  loading: boolean;
  screenData?: string;
} {
  const { data, loading, error } = useQuery(
    gql`
      query getRecordingPhoto($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          thumbnail
        }
      }
    `,
    { variables: { recordingId } }
  );

  if (!data) {
    return { loading, error };
  }

  if (error) {
    console.error("Apollo error while getting user photo", error);
  }

  const screenData = data.recording?.thumbnail;
  return { error, loading, screenData };
}

export function useGetOwnersAndCollaborators(
  recordingId: RecordingId
): {
  error: ApolloError | undefined;
  loading: boolean;
  recording: Recording | undefined;
  collaborators: CollaboratorDbData[] | null;
} {
  const { data, loading, error } = useQuery(
    gql`
      query GetOwnerAndCollaborators($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          owner {
            id
            name
            picture
          }
          collaborators {
            edges {
              node {
                ... on RecordingPendingUserCollaborator {
                  id
                  user {
                    id
                    name
                    picture
                  }
                }
                ... on RecordingUserCollaborator {
                  id
                  user {
                    id
                    name
                    picture
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      variables: { recordingId },
    }
  );

  if (loading) {
    return { collaborators: null, recording: undefined, loading, error };
  }

  if (error) {
    console.error("Apollo error while getting owners and collaborators", error);
  }

  let collaborators: CollaboratorDbData[] = [];
  if (data?.recording?.collaborators) {
    collaborators = data.recording.collaborators.edges.map(({ node }: any) => ({
      collaborationId: node.id,
      user: node.user,
    }));
  }
  const recording = convertRecording(data.recording);
  return { collaborators, recording, loading, error };
}

export function useGetIsPrivate(recordingId: RecordingId) {
  const { data, loading, error } = useQuery(
    gql`
      query GetRecordingPrivacy($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          private
        }
      }
    `,
    {
      variables: { recordingId },
    }
  );

  if (loading) {
    return { isPrivate: null, loading, error };
  }

  if (error) {
    console.error("Apollo error while getting isPrivate", error);
  }

  const isPrivate = data.recording?.private;

  return { isPrivate, loading, error };
}

export function useToggleIsPrivate(recordingId: RecordingId, isPrivate: boolean) {
  const [toggleIsPrivate] = useMutation(
    gql`
      mutation SetRecordingIsPrivate($recordingId: ID!, $isPrivate: Boolean!) {
        updateRecordingPrivacy(input: { id: $recordingId, private: $isPrivate }) {
          success
          recording {
            uuid
            private
          }
        }
      }
    `,
    {
      variables: { recordingId, isPrivate: !isPrivate },
      refetchQueries: ["GetRecordingPrivacy"],
    }
  );

  return toggleIsPrivate;
}

export function useUpdateIsPrivate() {
  const [updateIsPrivate] = useMutation(
    gql`
      mutation SetRecordingIsPrivate($recordingId: ID!, $isPrivate: Boolean!) {
        updateRecordingPrivacy(input: { id: $recordingId, private: $isPrivate }) {
          success
          recording {
            uuid
            private
          }
        }
      }
    `,
    {
      refetchQueries: ["GetRecordingPrivacy"],
    }
  );

  return updateIsPrivate;
}

export function useIsOwner(recordingId: RecordingId) {
  const { userId } = useGetUserId();
  const { data, loading, error } = useQuery(
    gql`
      query GetOwnerUserId($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          owner {
            id
          }
        }
      }
    `,
    {
      variables: { recordingId },
    }
  );

  if (loading) {
    return false;
  }

  if (error) {
    console.error("Apollo error while getting isOwner", error);
  }

  const recording = data.recording;
  if (!recording?.owner) {
    return false;
  }

  return userId === recording.owner.id;
}

export function useGetPersonalRecordings():
  | { recordings: null; loading: true }
  | { recordings: Recording[]; loading: false } {
  const { data, error, loading } = useQuery(
    gql`
      query GetMyRecordings {
        viewer {
          recordings {
            edges {
              node {
                uuid
                url
                title
                duration
                createdAt
                private
                isInitialized
                owner {
                  id
                  name
                  picture
                }
              }
            }
          }
        }
      }
    `,
    {
      pollInterval: 5000,
    }
  );

  if (loading) {
    return { recordings: null, loading };
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
  }

  let recordings: any = [];
  if (data?.viewer) {
    recordings = data.viewer.recordings.edges.map(({ node }: any) => convertRecording(node));
  }
  return { recordings, loading };
}

export function useGetWorkspaceRecordings(
  currentWorkspaceId: WorkspaceId
): { recordings: null; loading: true } | { recordings: Recording[]; loading: false } {
  const { data, error, loading } = useQuery(
    gql`
      query GetWorkspaceRecordings($workspaceId: ID!) {
        node(id: $workspaceId) {
          ... on Workspace {
            id
            recordings {
              edges {
                node {
                  uuid
                  url
                  title
                  duration
                  createdAt
                  private
                  isInitialized
                  owner {
                    id
                    name
                    picture
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      variables: { workspaceId: currentWorkspaceId },
      pollInterval: 5000,
    }
  );

  if (loading) {
    return { recordings: null, loading };
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
  }

  let recordings: Recording[] = [];
  if (data?.node?.recordings) {
    recordings = data.node.recordings.edges.map(({ node }: any) => convertRecording(node));
  }
  return { recordings, loading };
}

export function useUpdateRecordingWorkspace() {
  const [updateRecordingWorkspace] = useMutation(
    gql`
      mutation UpdateRecordingWorkspace($recordingId: ID!, $workspaceId: ID) {
        updateRecordingWorkspace(input: { id: $recordingId, workspaceId: $workspaceId }) {
          success
          recording {
            uuid
            workspace {
              id
            }
          }
        }
      }
    `,
    {
      refetchQueries: ["GetWorkspaceRecordings"],
    }
  );

  return updateRecordingWorkspace;
}

export function useGetMyRecordings() {
  return useGetPersonalRecordings();
}

export function useDeleteRecording(refetchQueries?: string[], onCompleted?: () => void) {
  const [deleteRecording] = useMutation(
    gql`
      mutation DeleteRecording($recordingId: ID!) {
        deleteRecording(input: { id: $recordingId }) {
          success
        }
      }
    `,
    {
      refetchQueries,
      onCompleted: onCompleted || (() => {}),
    }
  );

  return deleteRecording;
}

export function useInitializeRecording() {
  const [initializeRecording] = useMutation(
    gql`
      mutation InitializeRecording($recordingId: ID!, $title: String!, $workspaceId: ID) {
        initializeRecording(input: { id: $recordingId, title: $title, workspaceId: $workspaceId }) {
          success
          recording {
            uuid
            isInitialized
            title
            workspace {
              id
            }
          }
        }
      }
    `,
    { refetchQueries: ["GetRecording"] }
  );

  return initializeRecording;
}

export function useUpdateRecordingTitle() {
  const [updateRecordingTitle] = useMutation(
    gql`
      mutation UpdateRecordingTitle($recordingId: ID!, $title: String!) {
        updateRecordingTitle(input: { id: $recordingId, title: $title }) {
          success
          recording {
            uuid
            title
          }
        }
      }
    `
  );

  return updateRecordingTitle;
}
