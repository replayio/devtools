import { RecordingId } from "@recordreplay/protocol";
import { ApolloError, gql, useQuery } from "@apollo/client";

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

  const screenData = data.recordings_by_pk?.last_screen_data;
  return { error, loading, screenData };
}
