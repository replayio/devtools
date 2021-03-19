import { gql, useQuery, useMutation } from "@apollo/client";
import useToken from "ui/utils/useToken";

export interface Workspace {
  name: string;
  id: string;
  workspaces_users_aggregate: any;
}

export function crapola() {
  return null;
}

export function useCreateNewWorkspace() {
  const [createNewWorkspace, { error }] = useMutation(
    gql`
      mutation CreateNewWorkspace($userId: uuid, $name: String) {
        insert_workspaces(
          objects: { name: $name, workspaces_users: { data: { user_id: $userId } } }
        ) {
          affected_rows
        }
      }
    `,
    {
      refetchQueries: ["GetWorkspaces"],
    }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  return createNewWorkspace;
}

export function useGetWorkspaces() {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  const { data, loading, error } = useQuery(
    gql`
      query GetWorkspaces($userId: uuid) {
        workspaces(where: { workspaces_users: { user_id: { _eq: $userId } } }) {
          name
          id
          workspaces_users_aggregate {
            aggregate {
              count
            }
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

  const workspaces = data?.workspaces;
  return { workspaces, loading };
}
