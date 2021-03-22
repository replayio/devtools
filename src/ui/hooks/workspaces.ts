import { gql, useQuery, useMutation } from "@apollo/client";
import useToken from "ui/utils/useToken";
import { User } from "ui/types";

export interface Workspace {
  name: string;
  id: string;
  workspaces_users: WorkspaceUser[];
}

export interface WorkspaceUser {
  user: User;
  workspace_id: string;
  user_id: string;
  pending: boolean;
  workspace: {
    name: string;
  };
}

export function crapola() {
  return null;
}

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

  const workspaces = data?.workspaces;
  return { workspaces, loading };
}

export function useGetNonPendingWorkspaces() {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  const { data, loading, error } = useQuery(
    gql`
      query GetNonPendingWorkspaces($userId: uuid) {
        workspaces(
          where: {
            workspaces_users: { _and: { user_id: { _eq: $userId }, pending: { _eq: false } } }
          }
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

  const workspaces = data?.workspaces;
  return { workspaces, loading };
}

export function useGetWorkspaceMembers(workspaceId: string) {
  const { data, loading, error } = useQuery(
    gql`
      query GetWorkspaceMembers($workspaceId: uuid) {
        workspaces(where: { workspaces_users: { workspace_id: { _eq: $workspaceId } } }) {
          name
          id
          workspaces_users {
            pending
            user_id
            user {
              name
              email
              id
              picture
            }
          }
        }
      }
    `,
    {
      variables: { workspaceId },
    }
  );

  if (error) {
    console.error("Apollo error while fetching workspace members:", error);
  }

  const workspaceUsers: WorkspaceUser[] = data?.workspaces[0].workspaces_users;
  return { members: workspaceUsers, loading };
}

export function useInviteNewWorkspaceMember() {
  const [inviteNewWorkspaceMember, { error }] = useMutation(
    gql`
      mutation InviteNewWorkspaceMember($userId: uuid, $workspaceId: uuid) {
        insert_workspaces_user(objects: { user_id: $userId, workspace_id: $workspaceId }) {
          affected_rows
        }
      }
    `,
    { refetchQueries: ["GetWorkspaceMembers"] }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  return inviteNewWorkspaceMember;
}

export function useDeleteUserFromWorkspace() {
  const [deleteUserFromWorkspace, { error }] = useMutation(
    gql`
      mutation DeleteUserFromWorkspace($userId: uuid, $workspaceId: uuid) {
        delete_workspaces_user(
          where: { _and: { workspace_id: { _eq: $workspaceId }, user_id: { _eq: $userId } } }
        ) {
          affected_rows
        }
      }
    `,
    { refetchQueries: ["GetWorkspaceMembers"] }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  return deleteUserFromWorkspace;
}

export function useGetPendingWorkspaceInvitations() {
  const { claims } = useToken();
  const userId = claims?.hasura.userId;

  const { data, loading, error } = useQuery(
    gql`
      query GetPendingWorkspaceInvitations($userId: uuid) {
        workspaces_user(
          where: {
            user: {
              _and: { workspaces_users: { pending: { _eq: true }, user_id: { _eq: $userId } } }
            }
          }
        ) {
          user_id
          workspace_id
          pending
          workspace {
            name
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
    console.error("Apollo error while fetching pending workspace invitations:", error);
  }

  const invitations: WorkspaceUser[] = data?.workspaces_user;
  return { invitations, loading };
}

export function useAcceptPendingInvitation() {
  const [acceptPendingInvitation, { error }] = useMutation(
    gql`
      mutation AcceptPendingInvitation($userId: uuid, $workspaceId: uuid) {
        update_workspaces_user(
          where: { user_id: { _eq: $userId }, workspace_id: { _eq: $workspaceId } }
          _set: { pending: false }
        ) {
          affected_rows
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces", "GetPendingWorkspaceInvitations"],
    }
  );

  if (error) {
    console.error("Apollo error while accepting pending invitation:", error);
  }

  return acceptPendingInvitation;
}
