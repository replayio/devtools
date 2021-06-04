import { gql, useQuery, useMutation } from "@apollo/client";
import { WorkspaceUser } from "ui/types";

export function useGetWorkspaceMembers(workspaceId: string) {
  const { data, loading, error } = useQuery(
    gql`
      query GetWorkspaceMembers($workspaceId: ID!) {
        node(id: $workspaceId) {
          ... on Workspace {
            id
            members {
              edges {
                node {
                  ... on WorkspacePendingEmailMember {
                    __typename
                    id
                    email
                  }
                  ... on WorkspacePendingUserMember {
                    __typename
                    id
                    user {
                      id
                      name
                      picture
                    }
                  }
                  ... on WorkspaceUserMember {
                    __typename
                    id
                    user {
                      id
                      name
                      picture
                    }
                  }
                }
              }
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

  let workspaceUsers: WorkspaceUser[] | undefined = undefined;
  if (data?.node?.members) {
    workspaceUsers = data.node.members.edges.map(({ node }: any) => {
      if (node.__typename === "WorkspacePendingEmailMember") {
        return {
          membershipId: node.id,
          pending: true,
          email: node.email,
        };
      } else {
        return {
          membershipId: node.id,
          userId: node.user.id,
          pending: node.__typename === "WorkspacePendingUserMember",
          user: node.user,
        };
      }
    });
  }
  return { members: workspaceUsers, loading };
}

export function useInviteNewWorkspaceMember() {
  const [inviteNewWorkspaceMember] = useMutation(
    gql`
      mutation InviteNewWorkspaceMember($email: String!, $workspaceId: ID!) {
        addWorkspaceMember(input: { email: $email, workspaceId: $workspaceId }) {
          success
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
      mutation DeleteUserFromWorkspace($membershipId: ID!) {
        removeWorkspaceMember(input: { id: $membershipId }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetWorkspaceMembers"] }
  );

  return deleteUserFromWorkspace;
}

export function useAcceptPendingInvitation(onCompleted: () => void) {
  const [acceptPendingInvitation] = useMutation(
    gql`
      mutation AcceptPendingInvitation($workspaceId: ID!) {
        acceptWorkspaceMembership(input: { id: $workspaceId }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces", "GetPendingWorkspaces"],
      onCompleted,
    }
  );

  return acceptPendingInvitation;
}

export function useRejectPendingInvitation(onCompleted: () => void) {
  const [rejectPendingInvitation] = useMutation(
    gql`
      mutation RejectPendingInvitation($workspaceId: ID!) {
        rejectWorkspaceMembership(input: { id: $workspaceId }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces", "GetPendingWorkspaces"],
      onCompleted,
    }
  );

  return rejectPendingInvitation;
}
