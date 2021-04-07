import { gql, useQuery, useMutation } from "@apollo/client";
import { WorkspaceUser } from "ui/types";

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
  const [inviteNewWorkspaceMember] = useMutation(
    gql`
      mutation InviteNewWorkspaceMember($userId: uuid, $workspaceId: uuid, $inviterUserId: uuid) {
        insert_workspaces_user(
          objects: { user_id: $userId, workspace_id: $workspaceId, inviter_user_id: $inviterUserId }
        ) {
          affected_rows
        }
      }
    `,
    { refetchQueries: ["GetWorkspaceMembers"] }
  );

  return inviteNewWorkspaceMember;
}

export function useDeleteUserFromWorkspace() {
  const [deleteUserFromWorkspace] = useMutation(
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

  return deleteUserFromWorkspace;
}

export function useAcceptPendingInvitation() {
  const [acceptPendingInvitation] = useMutation(
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
      refetchQueries: ["GetNonPendingWorkspaces", "GetPendingWorkspaces"],
    }
  );

  return acceptPendingInvitation;
}
