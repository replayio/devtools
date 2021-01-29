import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { groupBy } from "lodash";

interface User {
  name: string;
  picture: string;
  auth_id: string;
  id: string;
}
interface Session {
  id: string;
  destroyed_at: string | null;
  user: User | null;
}
type Sessions = Session[];

export function useGetActiveSessions(recordingId: RecordingId) {
  const { data, loading } = useQuery(
    gql`
      query GetActiveSessions($recordingId: uuid!) {
        sessions(where: { recording_id: { _eq: $recordingId }, destroyed_at: { _is_null: true } }) {
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
      variables: { recordingId },
      pollInterval: 5000,
    }
  );

  if (loading) {
    return { loading };
  }

  const uniqueUsers = groupBy(data.sessions, session => session.user?.auth_id);
  const displayedSessions = Object.keys(uniqueUsers).reduce((acc: Sessions, key) => {
    if (key == "undefined") {
      return [...acc, ...uniqueUsers[key]];
    }

    return [...acc, uniqueUsers[key][0]];
  }, []);
  const displayedUsers = displayedSessions.map(session => session.user);

  return { users: displayedUsers, loading };
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
