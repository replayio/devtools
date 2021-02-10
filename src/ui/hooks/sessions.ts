import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { useAuth0 } from "@auth0/auth0-react";

interface User {
  name: string;
  picture: string;
  auth_id: string;
  id: string;
  sessionId?: string;
}
interface Session {
  id: string;
  destroyed_at: string | null;
  user: User | null;
}

export function useGetActiveSessions(recordingId: RecordingId, sessionId: string) {
  const { user } = useAuth0();
  const { data, loading } = useQuery(
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
            auth_id
          }
        }
      }
    `,
    {
      variables: { recordingId, sessionId },
      pollInterval: 5000,
    }
  );

  if (loading) {
    return { loading };
  }

  // Don't show the user's own sessions.
  const filteredSessions = data.sessions.filter(
    (session: Session) => session.user?.auth_id !== user?.sub
  );

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
  const { data, loading: queryIsLoading } = useQuery(
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

  return { data, queryIsLoading };
}

export async function fetchUserId(authId: string) {
  const response = await query({
    query: gql`
      query GetUserId($authId: String) {
        users(where: { auth_id: { _eq: $authId } }) {
          id
        }
      }
    `,
    variables: { authId },
  });

  return response.data?.users[0].id;
}

export function useAddSessionUser() {
  const [AddSessionUser] = useMutation(gql`
    mutation AddSessionUser($id: String!, $user_id: uuid!) {
      update_sessions_by_pk(pk_columns: { id: $id }, _set: { user_id: $user_id }) {
        id
        user_id
      }
    }
  `);
  return AddSessionUser;
}
