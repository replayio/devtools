import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation } from "@apollo/client";
import { mutate, query } from "ui/utils/apolloClient";

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
      update_sessions(_set: { user_id: $user_id }, where: { id: { _eq: $id } }) {
        returning {
          id
          user_id
        }
      }
    }
  `);
  return AddSessionUser;
}

export function setSessionError({ sessionId, code }: { sessionId: string; code: number }) {
  return mutate({
    mutation: gql`
      mutation AddSessionError($sessionId: String, $error: String) {
        update_sessions(where: { id: { _eq: $sessionId } }, _set: { error: $error }) {
          returning {
            id
            error
          }
        }
      }
    `,
    variables: { sessionId, error: `${code}` },
  });
}
