import { RecordingId } from "@replayio/protocol";

import { GraphQLClientInterface } from "./GraphQLClient";

const AddCollaboratorMutation = `
  mutation AddCollaborator($email: String!, $recordingId: ID!) {
    addRecordingCollaborator(input: { email: $email, recordingId: $recordingId }) {
      success
    }
  }
`;

export async function addCollaborator(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  recordingId: RecordingId,
  email: string
) {
  await graphQLClient.send(
    {
      operationName: "AddCollaborator",
      query: AddCollaboratorMutation,
      variables: {
        email,
        recordingId,
      },
    },
    accessToken
  );
}
