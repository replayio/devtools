import { gql, useQuery, useMutation } from "@apollo/client";
import { WorkspaceUser } from "ui/types";

export function useGetWorkspaceMembers(workspaceId: string) {
  if (!workspaceId) {
    return { members: [], loading: false };
  }
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
                    roles
                    email
                    createdAt
                  }
                  ... on WorkspacePendingUserMember {
                    __typename
                    id
                    roles
                    user {
                      id
                      name
                      picture
                    }
                  }
                  ... on WorkspaceUserMember {
                    __typename
                    id
                    roles
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
          createdAt: node.createdAt,
          roles: node.roles,
        };
      } else {
        return {
          membershipId: node.id,
          userId: node.user.id,
          pending: node.__typename === "WorkspacePendingUserMember",
          user: node.user,
          roles: node.roles,
        };
      }
    });
  }
  return { members: workspaceUsers, loading };
}

export function useInviteNewWorkspaceMember(onCompleted: () => void) {
  // Eventually we should handle error states better. For now, this is sufficient
  // to handle error cases where a user tries to add an already invited/existing
  // user to a team.
  const onError = onCompleted;

  const [inviteNewWorkspaceMember] = useMutation(
    gql`
      mutation InviteNewWorkspaceMember($email: String!, $workspaceId: ID!, $roles: [String!]) {
        addWorkspaceMember(input: { email: $email, workspaceId: $workspaceId, roles: $roles }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetWorkspaceMembers"], onCompleted, onError }
  );

  return inviteNewWorkspaceMember;
}

export function useClaimTeamInvitationCode(onCompleted: () => void, onError: () => void) {
  const [inviteNewWorkspaceMember] = useMutation(
    gql`
      mutation ClaimTeamInvitationCode($code: ID!) {
        claimTeamInvitationCode(input: { code: $code }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetPendingWorkspaces"], onCompleted, onError }
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
