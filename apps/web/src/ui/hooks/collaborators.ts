import { gql, useMutation } from "@apollo/client";
import { RecordingId } from "@recordreplay/protocol";
import { useGetRecording } from "./recordings";
import { useGetUserId } from "./users";

export function useIsCollaborator(recordingId: RecordingId) {
  const { userId } = useGetUserId();
  const { recording } = useGetRecording(recordingId);

  if (userId && recording?.collaborators) {
    return recording.collaborators.some(collaboratorId => collaboratorId === userId);
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

export function useAddNewCollaborator(onCompleted: () => void, onError: () => void) {
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
      onCompleted,
      onError,
    }
  );

  if (error) {
    console.error("Apollo error while adding a collaborator", error);
  }

  return { addNewCollaborator, loading, error };
}
