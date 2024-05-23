import { ApolloError, gql, useMutation, useQuery } from "@apollo/client";

import {
  ClaimTeamInvitationCode,
  ClaimTeamInvitationCodeVariables,
} from "shared/graphql/generated/ClaimTeamInvitationCode";
import {
  DeleteUserFromWorkspace,
  DeleteUserFromWorkspaceVariables,
} from "shared/graphql/generated/DeleteUserFromWorkspace";
import {
  GetWorkspaceMembers,
  GetWorkspaceMembersVariables,
} from "shared/graphql/generated/GetWorkspaceMembers";
import {
  InviteNewWorkspaceMember,
  InviteNewWorkspaceMemberVariables,
} from "shared/graphql/generated/InviteNewWorkspaceMember";
import { WorkspaceUser, WorkspaceUserRole } from "shared/graphql/types";

export function useGetWorkspaceMembers(workspaceId: string) {
  const { data, loading, error } = useQuery<GetWorkspaceMembers, GetWorkspaceMembersVariables>(
    gql`
      query GetWorkspaceMembers($workspaceId: ID!) {
        node(id: $workspaceId) {
          ... on Workspace {
            id
            members {
              edges {
                node {
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

  if (!workspaceId || !data?.node || !("members" in data.node)) {
    return { members: [], loading: false };
  }

  if (error) {
    console.error("Apollo error while fetching workspace members:", error);
  }

  let workspaceUsers: WorkspaceUser[] | undefined = undefined;
  const members = data.node.members;
  if (members) {
    workspaceUsers = [];
    for (const { node } of members.edges) {
      if (node.__typename === "WorkspaceUserMember") {
        workspaceUsers.push({
          membershipId: node.id,
          userId: node.user.id,
          user: node.user,
          roles: node.roles as WorkspaceUserRole[],
        });
      }
    }
  }
  return { members: workspaceUsers, loading };
}

export function useInviteNewWorkspaceMember(
  onCompleted: () => void,
  onError: (err: ApolloError) => void = onCompleted
) {
  const [inviteNewWorkspaceMember] = useMutation<
    InviteNewWorkspaceMember,
    InviteNewWorkspaceMemberVariables
  >(
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

export function useClaimTeamInvitationCode(
  onCompleted: (workspaceId: string | null) => void,
  onError: () => void
) {
  const [inviteNewWorkspaceMember] = useMutation<
    ClaimTeamInvitationCode,
    ClaimTeamInvitationCodeVariables
  >(
    gql`
      mutation ClaimTeamInvitationCode($code: ID!) {
        claimTeamInvitationCode(input: { code: $code }) {
          success
          workspaceId
        }
      }
    `,
    { onCompleted: data => onCompleted(data.claimTeamInvitationCode.workspaceId), onError }
  );

  return inviteNewWorkspaceMember;
}

export function useDeleteUserFromWorkspace() {
  const [deleteUserFromWorkspace] = useMutation<
    DeleteUserFromWorkspace,
    DeleteUserFromWorkspaceVariables
  >(
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
