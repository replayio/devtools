import { gql, useQuery } from "@apollo/client";
import { RecordingId } from "@replayio/protocol";

import { query } from "shared/graphql/apolloClient";
import { GetRecording, GetRecordingVariables } from "shared/graphql/generated/GetRecording";

export const GET_RECORDING_TITLE = gql`
  query GetRecordingUserId($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      title
    }
  }
`;
export async function getRecordingTitle(recordingId: RecordingId) {
  const result = await query<GetRecording, GetRecordingVariables>({
    query: GET_RECORDING_TITLE,
    variables: { recordingId },
  });

  return result.data?.recording?.title;
}

export function useGetRecordingTitle(recordingId: RecordingId | null | undefined): {
  title: string | undefined;
  loading: boolean;
} {
  const { data, error, loading, refetch } = useQuery<GetRecording, GetRecordingVariables>(
    GET_RECORDING_TITLE,
    {
      variables: { recordingId },
      skip: !recordingId,
    }
  );

  if (error) {
    console.error("Apollo error while getting the recording", error);
  }

  return { loading, title: data?.recording?.title || undefined };
}
