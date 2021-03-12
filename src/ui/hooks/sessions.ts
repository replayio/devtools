import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation } from "@apollo/client";
import useToken from "ui/utils/useToken";

interface User {
  name: string;
  picture: string;
  id: string;
  sessionId?: string;
}
interface Session {
  id: string;
  destroyed_at: string | null;
  user: User | null;
}

export function useGetActiveSessions(recordingId: RecordingId, sessionId: string) {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;
  const { data, error, loading } = useQuery(
    gql`
      query GetActiveSessions($recordingId: uuid!, $sessionId: String!) {
        sessions(
          where: {
            recording_id: { _eq: $recordingId }
            destroyed_at: { _is_null: true }
            _and: { id: { _neq: $sessionId } }
          }
        ) {
          id
          destroyed_at
          user {
            id
            name
            picture
          }
        }
      }
    `,
    {
      variables: { recordingId, sessionId },
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while getting active sessions", error);
  }

  if (loading) {
    return { loading };
  }

  if (!data) {
    return { loading, error };
  }

  // Don't show the user's own sessions.
  const filteredSessions = data.sessions.filter((session: Session) => session.user?.id !== userId);

  // This includes the sessionId with the user. Otherwise, all
  // anonymous users look the same (null) and we can't maintain some order.
  const users = filteredSessions
    .map((session: Session) => ({
      ...session.user,
      sessionId: session.id,
    }))
    .sort();

  return { users, loading };
}

export function useGetRecording(recordingId: RecordingId) {
  const { data, error, loading } = useQuery(
    gql`
      query GetRecording($recordingId: uuid!) {
        recordings(where: { id: { _eq: $recordingId } }) {
          id
          title
          recordingTitle
          is_private
          date
          deleted_at
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

  return { data, loading };
}

export function useAddSessionUser() {
  const [AddSessionUser, { error }] = useMutation(gql`
    mutation AddSessionUser($id: String!, $user_id: uuid!) {
      update_sessions_by_pk(pk_columns: { id: $id }, _set: { user_id: $user_id }) {
        id
        user_id
      }
    }
  `);

  if (error) {
    console.error("Apollo error while adding a session user", error);
  }

  return AddSessionUser;
}
