import { gql, useQuery, useMutation } from "@apollo/client";
import { Workspace } from "ui/types";
import { getUserId } from "ui/utils/useToken";

export function useCreateNewWorkspace() {
  const [createNewWorkspace, { error }] = useMutation(
    gql`
      mutation CreateNewWorkspace($userId: uuid, $name: String) {
        insert_workspaces(
          objects: { name: $name, workspaces_users: { data: { user_id: $userId, pending: false } } }
        ) {
          affected_rows
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces"],
    }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  return createNewWorkspace;
}

export function useGetPendingWorkspaces() {
  const userId = getUserId();
  const { data, loading, error } = useQuery(
    gql`
      query GetPendingWorkspaces($userId: uuid) {
        workspaces(
          where: { workspaces_users: { user_id: { _eq: $userId }, pending: { _eq: true } } }
        ) {
          id
          name
        }
      }
    `,
    {
      variables: { userId },
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while fetching pending workspace invitations:", error);
  }

  const pendingWorkspaces: Workspace[] = data?.workspaces;
  return { pendingWorkspaces, loading };
}

export function useGetNonPendingWorkspaces(): { workspaces: Workspace[]; loading: boolean } {
  const userId = getUserId();
  const { data, loading, error } = useQuery(
    gql`
      query GetNonPendingWorkspaces($userId: uuid) {
        workspaces(
          where: { workspaces_users: { user_id: { _eq: $userId }, pending: { _eq: false } } }
        ) {
          name
          id
          workspaces_users {
            pending
          }
        }
      }
    `,
    {
      variables: { userId },
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  const workspaces: Workspace[] = data?.workspaces || [];
  return { workspaces, loading };
}
