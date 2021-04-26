import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation } from "@apollo/client";
import { User } from "ui/state/session";
import { useGetUserId } from "./users";

interface SessionUser extends User {
  sessionId?: string;
}
interface Session {
  id: string;
  user: User | null;
}

export function useGetActiveSessions(recordingId: RecordingId) {
  const { userId, loading: userLoading } = useGetUserId();
  const { data, error, loading } = useQuery(
    gql`
      query GetActiveSessions($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
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
    `,
    {
      variables: { recordingId },
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while getting active sessions", error);
  }

  if (loading || userLoading) {
    return { loading: true };
  }

  if (!data) {
    return { loading, error };
  }

  // Don't show the user's own sessions.
  const activeSessions = data.recording.activeSessions || [];
  const filteredSessions = activeSessions.filter((session: Session) => session.user?.id !== userId);

  // This includes the sessionId with the user. Otherwise, all
  // anonymous users look the same (null) and we can't maintain some order.
  const users: SessionUser[] = filteredSessions
    .map((session: Session) => ({
      ...session.user,
      sessionId: session.id,
    }))
    .sort();

  return { users, loading };
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
