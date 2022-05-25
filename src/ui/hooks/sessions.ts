import { RecordingId } from "@replayio/protocol";
import { gql, useQuery, useMutation } from "@apollo/client";
import { User } from "ui/state/session";
import { useGetUserId } from "./users";
import { GET_ACTIVE_SESSIONS } from "ui/graphql/sessions";
import { GetActiveSessions, GetActiveSessionsVariables } from "graphql/GetActiveSessions";
import { filter } from "lodash";

interface SessionUser extends User {
  sessionId?: string;
}
interface Session {
  id: string;
  user: User | null;
}

export function useGetActiveSessions(recordingId: RecordingId) {
  const { userId, loading: userLoading } = useGetUserId();
  const { data, error, loading } = useQuery<GetActiveSessions, GetActiveSessionsVariables>(
    GET_ACTIVE_SESSIONS,
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
  const activeSessions = data.recording?.activeSessions || [];
  const filteredSessions = activeSessions.filter(session => session.user?.id !== userId);

  // This includes the sessionId with the user. Otherwise, all anonymous users
  // look the same (null) and we can't maintain some order.
  const users: SessionUser[] = (
    filteredSessions
      .map(session => ({
        ...session.user,
        sessionId: session.id,
      }))
      .filter(i => i.name !== null) as SessionUser[]
  ).sort();

  return { users, loading };
}
