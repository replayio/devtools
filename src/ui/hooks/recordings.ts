import { RecordingId } from "@recordreplay/protocol";
import { ApolloError, gql, useQuery, useMutation } from "@apollo/client";
import useToken from "ui/utils/useToken";

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
    return { collaborators: null, recording_by_pk: null, loading, error };
  }

  if (error) {
    console.error("Apollo error while getting owners and collaborators", error);
  }

  const { collaborators, recordings_by_pk: recording } = data;
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
