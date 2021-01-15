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
      update_sessions_by_pk(pk_columns: { id: $id }, _set: { user_id: $user_id }) {
        id
        user_id
      }
    }
  `);
  return AddSessionUser;
}
