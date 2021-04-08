import { RecordingId } from "@recordreplay/protocol";
import { ApolloError, gql, useQuery, useMutation } from "@apollo/client";
import { User, Recording } from "ui/types";
import useToken, { getUserId } from "ui/utils/useToken";
import { WorkspaceId } from "ui/state/app";
import { CollaboratorDbData } from "ui/components/shared/SharingModal/CollaboratorsList";

type PersonalRecordingsData = {
  users: User[];
  recordings: Recording[];
};

function isTest() {
  return new URL(window.location.href).searchParams.get("test");
}

export function useGetRecording(recordingId: RecordingId) {
  const { data, error, loading } = useQuery(
    gql`
      query GetRecording($recordingId: uuid!) {
        recordings(where: { id: { _eq: $recordingId } }) {
          id
          user_id
          title
          recordingTitle
          is_private
          is_initialized
          date
          deleted_at
          user {
            invited
          }
        }
      }
    `,
    {
      variables: { recordingId },
    }
  );

  if (error) {
    console.error("Apollo error while getting the recording", error);
  }

  const recording = data?.recordings[0];
  // Tests don't have an associated user so we just let it bypass the check here.
  const isAuthorized = isTest() || recording;
  return { recording, isAuthorized, loading };
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
      query getRecordingPhoto($recordingId: uuid!) {
        recordings_by_pk(id: $recordingId) {
          last_screen_data
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

  const screenData = data.recordings_by_pk?.last_screen_data;
  return { error, loading, screenData };
}

export function useGetOwnersAndCollaborators(recordingId: RecordingId) {
  const { data, loading, error } = useQuery(
    gql`
      query GetOwnerAndCollaborators($recordingId: uuid!) {
        collaborators(where: { recording_id: { _eq: $recordingId } }) {
          user {
            email
            id
            name
            nickname
            picture
          }
          user_id
          recording_id
        }
        recordings_by_pk(id: $recordingId) {
          user {
            email
            id
            name
            nickname
            picture
          }
          id
          is_private
        }
      }
    `,
    {
      variables: { recordingId },
    }
  );

  if (loading) {
    return { collaborators: null, recording: null, loading, error };
  }

  if (error) {
    console.error("Apollo error while getting owners and collaborators", error);
  }

  const collaborators: CollaboratorDbData[] = data.collaborators;
  const recording = data.recordings_by_pk;
  return { collaborators, recording, loading, error };
}

export function useGetIsPrivate(recordingId: RecordingId) {
  const { data, loading, error } = useQuery(
    gql`
      query GetRecordingPrivacy($recordingId: uuid!) {
        recordings(where: { id: { _eq: $recordingId } }) {
          id
          is_private
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

  const isPrivate = data.recordings[0]?.is_private;

  return { isPrivate, loading, error };
}

export function useUpdateIsPrivate(recordingId: RecordingId, isPrivate: boolean) {
  const [updateIsPrivate] = useMutation(
    gql`
      mutation SetRecordingIsPrivate($recordingId: uuid!, $isPrivate: Boolean) {
        update_recordings(where: { id: { _eq: $recordingId } }, _set: { is_private: $isPrivate }) {
          returning {
            is_private
            id
          }
        }
      }
    `,
    {
      variables: { recordingId, isPrivate: !isPrivate },
      refetchQueries: ["GetRecordingPrivacy"],
    }
  );

  return updateIsPrivate;
}

export function useIsOwner(recordingId: RecordingId) {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;
  const { data, loading, error } = useQuery(
    gql`
      query GetOwnerUserId($recordingId: uuid!) {
        recordings(where: { id: { _eq: $recordingId } }) {
          user_id
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

  const recording = data.recordings[0];
  if (!recording?.user_id) {
    return false;
  }

  return userId === recording.user_id;
}

function getRecordings(data: PersonalRecordingsData) {
  if (!data.users.length) {
    return [];
  }

  const user = data.users[0];
  const { recordings, collaborators, name, email, picture, id } = user;

  return [
    ...recordings.map(recording => ({ ...recording, user: { name, email, picture, id } })),
    ...collaborators!.map(({ recording }) => recording),
    ...data.recordings,
  ];
}

export function useGetRecordings(
  currentWorkspaceId: WorkspaceId
): { recordings: null; loading: true } | { recordings: Recording[]; loading: false } {
  const { data, error, loading } = useQuery(
    gql`
      query GetWorkspaceRecordings($workspaceId: uuid) {
        recordings(
          where: { _and: { workspace_id: { _eq: $workspaceId }, deleted_at: { _is_null: true } } }
        ) {
          id
          url
          title
          recording_id
          recordingTitle
          last_screen_mime_type
          duration
          description
          date
          is_private
          user {
            name
            email
            picture
            id
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

  let recordings = data?.recordings;
  return { recordings, loading };
}

export function useUpdateRecordingWorkspace() {
  const [updateRecordingWorkspace] = useMutation(
    gql`
      mutation UpdateRecordingWorkspace($recordingId: uuid!, $workspaceId: uuid) {
        update_recordings(
          where: { id: { _eq: $recordingId } }
          _set: { workspace_id: $workspaceId }
        ) {
          returning {
            id
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
  const userId = getUserId();
  const { data, loading, error } = useQuery(
    gql`
      fragment recordingFields on recordings {
        id
        url
        title
        recording_id
        recordingTitle
        last_screen_mime_type
        duration
        description
        date
        is_private
      }

      fragment avatarFields on users {
        name
        email
        picture
        id
      }

      query GetMyRecordings($userId: uuid) {
        users(where: { id: { _eq: $userId } }) {
          ...avatarFields
          collaborators(where: { recording: { deleted_at: { _is_null: true } } }) {
            recording {
              ...recordingFields
              user {
                ...avatarFields
              }
            }
          }
          recordings(where: { deleted_at: { _is_null: true } }) {
            ...recordingFields
          }
        }

        recordings(where: { _and: { example: { _eq: true }, deleted_at: { _is_null: true } } }) {
          ...recordingFields
          user {
            ...avatarFields
          }
        }
      }
    `,
    {
      variables: { userId },
      pollInterval: 10000,
    }
  );

  if (loading) {
    return { loading };
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
  }

  const recordings = getRecordings(data);

  return { recordings, loading };
}

export function useDeleteRecording(refetchQueries?: string[], onCompleted?: () => void) {
  const [deleteRecording] = useMutation(
    gql`
      mutation DeleteRecording($recordingId: uuid!, $deletedAt: String) {
        update_recordings(where: { id: { _eq: $recordingId } }, _set: { deleted_at: $deletedAt }) {
          returning {
            id
          }
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
      mutation InitializeRecording($recordingId: uuid!, $title: String, $workspaceId: uuid) {
        update_recordings_by_pk(
          pk_columns: { id: $recordingId }
          _set: { is_initialized: true, recordingTitle: $title, workspace_id: $workspaceId }
        ) {
          id
          is_initialized
          title
          recordingTitle
          workspace_id
        }
      }
    `,
    { refetchQueries: ["GetRecording"] }
  );

  return initializeRecording;
}
