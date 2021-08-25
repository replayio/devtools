import { gql, useQuery, useMutation } from "@apollo/client";
import { PendingWorkspaceInvitation, Workspace } from "ui/types";

const NO_WORKSPACES: Workspace[] = [];

export function useCreateNewWorkspace(onCompleted: (data: any) => void) {
  const [createNewWorkspace, { error }] = useMutation<any, { name: string; planKey?: string }>(
    gql`
      mutation CreateNewWorkspace($name: String!, $planKey: String) {
        createWorkspace(input: { name: $name, planKey: $planKey }) {
          success
          workspace {
            id
            invitationCode
            domain
            isDomainLimitedCode
          }
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces"],
      onCompleted: data => {
        onCompleted(data.createWorkspace.workspace);
      },
    }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  return createNewWorkspace;
}

export function useGetPendingWorkspaces() {
  const { data, loading, error } = useQuery(
    gql`
      query GetPendingWorkspaces {
        viewer {
          workspaceInvitations {
            edges {
              node {
                workspace {
                  id
                  name
                  recordingCount
                }
                inviterEmail
              }
            }
          }
        }
      }
    `,
    {
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while fetching pending workspace invitations:", error);
  }

  let pendingWorkspaces: PendingWorkspaceInvitation[] | undefined = undefined;
  if (data?.viewer) {
    pendingWorkspaces = data.viewer.workspaceInvitations.edges.map(
      ({ node: { workspace, inviterEmail } }: any) => ({
        ...workspace,
        inviterEmail,
      })
    );
  }
  return { pendingWorkspaces, loading };
}

export function useGetNonPendingWorkspaces(): { workspaces: Workspace[]; loading: boolean } {
  const { data, loading, error } = useQuery(
    gql`
      query GetNonPendingWorkspaces {
        viewer {
          workspaces {
            edges {
              node {
                id
                name
                invitationCode
                domain
                isDomainLimitedCode
                members {
                  edges {
                    node {
                      ... on WorkspaceUserMember {
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
        }
      }
    `,
    {
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while creating a new workspace:", error);
  }

  let workspaces: Workspace[] = NO_WORKSPACES;
  if (data?.viewer) {
    workspaces = data.viewer.workspaces.edges.map(({ node }: any) => {
      const members = node.members.edges.map(({ node }: any) => node.user);
      return { ...node, members };
    });
  }

  return { workspaces, loading };
}

export function useUpdateWorkspaceCodeDomainLimitations() {
  const [updateWorkspaceCodeDomainLimitations] = useMutation(
    gql`
      mutation UpdateWorkspaceCodeDomainLimitations($workspaceId: ID!, $isLimited: Boolean!) {
        updateWorkspaceCodeDomainLimitations(
          input: { workspaceId: $workspaceId, isLimited: $isLimited }
        ) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces"],
    }
  );

  return updateWorkspaceCodeDomainLimitations;
}

export function useDeleteWorkspace() {
  const [deleteWorkspace] = useMutation(
    gql`
      mutation DeleteWorkspace($workspaceId: ID!, $shouldDeleteRecordings: Boolean!) {
        deleteWorkspace(
          input: { workspaceId: $workspaceId, shouldDeleteRecordings: $shouldDeleteRecordings }
        ) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces"],
    }
  );

  return deleteWorkspace;
}
