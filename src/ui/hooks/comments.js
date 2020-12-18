import { gql, useQuery } from "@apollo/client";

const GET_COMMENTS = gql`
  query GetComments($recordingId: uuid) {
    comments(where: { recording_id: { _eq: $recordingId } }) {
      id
      content
      created_at
      recording_id
      user_id
      updated_at
      time
      point
      has_frames
    }
  }
`;

export function useGetComments(recordingId) {
  const { data, loading, error } = useQuery(GET_COMMENTS, {
    variables: { recordingId },
  });

  return { comments: data?.comments, loading, error };
}
