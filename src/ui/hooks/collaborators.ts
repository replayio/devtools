import { gql, useMutation } from "@apollo/client";
import { RecordingId } from "@recordreplay/protocol";
import { useGetPersonalRecordings } from "./recordings";

export function useIsCollaborator(recordingId: RecordingId) {
  const { recordings } = useGetPersonalRecordings();

  if (recordings) {
    return !!recordings.find(recording => recording.id == recordingId);
  }

  return false;
}

export function useDeleteCollaborator() {
  const [deleteCollaborator, { error }] = useMutation(
    gql`
      mutation DeleteCollaborator($collaborationId: ID!) {
        removeRecordingCollaborator(input: { id: $collaborationId }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetOwnerAndCollaborators"],
    }
  );

  if (error) {
    console.error("Apollo error while deleting a collaborator", error);
  }

  return { deleteCollaborator, error };
}

export function useAddNewCollaborator() {
  const [addNewCollaborator, { loading, error }] = useMutation(
    gql`
      mutation AddCollaborator($email: String!, $recordingId: ID!) {
        addRecordingCollaborator(input: { email: $email, recordingId: $recordingId }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetOwnerAndCollaborators"],
    }
  );

  if (error) {
    console.error("Apollo error while adding a collaborator", error);
  }

  return { addNewCollaborator, loading, error };
}
