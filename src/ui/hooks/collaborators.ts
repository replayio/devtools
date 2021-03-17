import { gql, useQuery, useMutation } from "@apollo/client";

export function useDeleteCollaborator() {
  const [deleteCollaborator, { error }] = useMutation(
    gql`
      mutation DeleteCollaborator($recordingId: uuid, $userId: uuid) {
        delete_collaborators(
          where: { _and: { recording_id: { _eq: $recordingId } }, user_id: { _eq: $userId } }
        ) {
          affected_rows
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
      mutation AddCollaborator($objects: [collaborators_insert_input!]! = {}) {
        insert_collaborators(objects: $objects) {
          affected_rows
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

export function useFetchCollaboratorId(email: string) {
  const { data, loading, error } = useQuery(
    gql`
      query GetCollaboratorId($email: String = "") {
        user_id_by_email(args: { email: $email }) {
          id
        }
      }
    `,
    {
      variables: { email },
    }
  );

  if (error) {
    console.error("Apollo error while fetching collaborator ID for ", email, error);
  }

  const userId = data?.user_id_by_email[0]?.id;

  return { userId, loading, error };
}
