import { gql, useQuery, useMutation } from "@apollo/client";
import {
  CANCEL_WORKSPACE_SUBSCRIPTION,
  ADD_WORKSPACE_API_KEY,
  DELETE_WORKSPACE_API_KEY,
  GET_WORKSPACE_API_KEYS,
  UPDATE_WORKSPACE_MEMBER_ROLE,
  GET_WORKSPACE_SUBSCRIPTION,
  PREPARE_WORKSPACE_PAYMENT_METHOD,
  SET_WORKSPACE_DEFAULT_PAYMENT_METHOD,
} from "ui/graphql/workspaces";
import { PendingWorkspaceInvitation, Subscription, Workspace, WorkspaceUserRole } from "ui/types";

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
                subscription {
                  status
                  trialEnds
                }
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

export function useGetWorkspaceApiKeys(workspaceId: string) {
  const { data, loading, error } = useQuery<{ node: Pick<Required<Workspace>, "apiKeys"> }>(
    GET_WORKSPACE_API_KEYS,
    {
      variables: { workspaceId },
    }
  );

  return { data, loading, error };
}

export function useAddWorkspaceApiKey() {
  const [addWorkspaceApiKey, { loading, error }] = useMutation(ADD_WORKSPACE_API_KEY, {
    refetchQueries: ["GetWorkspaceApiKeys"],
  });

  return { addWorkspaceApiKey, loading, error };
}

export function useDeleteWorkspaceApiKey() {
  const [deleteWorkspaceApiKey, { loading, error }] = useMutation(DELETE_WORKSPACE_API_KEY, {
    refetchQueries: ["GetWorkspaceApiKeys"],
  });

  return { deleteWorkspaceApiKey, loading, error };
}

export function useUpdateWorkspaceMemberRole() {
  const [updateWorkspaceMemberRole, { loading, error }] = useMutation<
    any,
    { id: string; roles: WorkspaceUserRole[] }
  >(UPDATE_WORKSPACE_MEMBER_ROLE, {
    refetchQueries: ["GetWorkspaceMembers"],
  });

  return { updateWorkspaceMemberRole, loading, error };
}

export function useGetWorkspaceSubscription(workspaceId: string) {
  const { data, loading, error, refetch } = useQuery<{
    node: Pick<Required<Workspace>, "subscription">;
  }>(GET_WORKSPACE_SUBSCRIPTION, {
    variables: { workspaceId },
  });

  return { data, loading, error, refetch };
}

export function useCancelWorkspaceSubscription() {
  const [cancelWorkspaceSubscription, { loading, error }] = useMutation<
    Subscription,
    { workspaceId: string }
  >(CANCEL_WORKSPACE_SUBSCRIPTION, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { cancelWorkspaceSubscription, loading, error };
}

export function usePrepareWorkspacePaymentMethod() {
  const [prepareWorkspacePaymentMethod, { loading, error }] = useMutation<
    { prepareWorkspacePaymentMethod: { paymentSecret: string } },
    { workspaceId: string }
  >(PREPARE_WORKSPACE_PAYMENT_METHOD, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { prepareWorkspacePaymentMethod, loading, error };
}

export function useSetWorkspaceDefaultPaymentMethod() {
  const [setWorkspaceDefaultPaymentMethod, { loading, error }] = useMutation<
    any,
    { workspaceId: string; paymentMethodId: string }
  >(SET_WORKSPACE_DEFAULT_PAYMENT_METHOD, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { setWorkspaceDefaultPaymentMethod, loading, error };
}
