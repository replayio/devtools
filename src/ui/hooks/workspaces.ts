import { gql, useQuery, useMutation } from "@apollo/client";
import {
  CreateWorkspaceAPIKey,
  CreateWorkspaceAPIKeyVariables,
} from "graphql/CreateWorkspaceAPIKey";
import { DeleteWorkspace, DeleteWorkspaceVariables } from "graphql/DeleteWorkspace";
import {
  DeleteWorkspaceAPIKey,
  DeleteWorkspaceAPIKeyVariables,
} from "graphql/DeleteWorkspaceAPIKey";
import {
  UpdateWorkspaceCodeDomainLimitations,
  UpdateWorkspaceCodeDomainLimitationsVariables,
} from "graphql/UpdateWorkspaceCodeDomainLimitations";
import {
  ACTIVATE_WORKSPACE_SUBSCRIPTION,
  ADD_WORKSPACE_API_KEY,
  CANCEL_WORKSPACE_SUBSCRIPTION,
  DELETE_WORKSPACE_API_KEY,
  DELETE_WORKSPACE_PAYMENT_METHOD,
  GET_WORKSPACE_API_KEYS,
  GET_WORKSPACE_SUBSCRIPTION,
  PREPARE_WORKSPACE_PAYMENT_METHOD,
  SET_WORKSPACE_DEFAULT_PAYMENT_METHOD,
  UPDATE_WORKSPACE_MEMBER_ROLE,
} from "ui/graphql/workspaces";
import {
  PartialWorkspaceSettingsFeatures,
  PendingWorkspaceInvitation,
  Subscription,
  Workspace,
  WorkspaceUserRole,
} from "ui/types";

const NO_WORKSPACES: Workspace[] = [];

export function useCreateNewWorkspace(onCompleted: (data: any) => void) {
  const [createNewWorkspace, { error }] = useMutation<any, { name: string; planKey?: string }>(
    gql`
      mutation CreateNewWorkspace($name: String!, $planKey: String!) {
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
                  isOrganization
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

export function useGetWorkspace(workspaceId: string): { workspace?: Workspace; loading: boolean } {
  // TODO: We need a better way to do this but this'll do for now
  const { workspaces, loading } = useGetNonPendingWorkspaces();

  return {
    workspace: workspaces.find(ws => ws.id === workspaceId),
    loading,
  };
}

export function useUpdateWorkspaceLogo() {
  const [updateWorkspaceLogo] = useMutation<
    any,
    {
      workspaceId: string;
      logo: string | null;
    }
  >(
    gql`
      mutation UpdateWorkspaceLogo($workspaceId: ID!, $logo: String) {
        updateWorkspaceLogo(input: { workspaceId: $workspaceId, logo: $logo }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces"],
    }
  );

  return updateWorkspaceLogo;
}

export function useUpdateWorkspaceSettings() {
  const [updateWorkspaceSettings] = useMutation<
    any,
    {
      workspaceId: string;
      name?: string | null;
      logo?: string | null;
      motd?: string | null;
      features?: PartialWorkspaceSettingsFeatures;
    }
  >(
    gql`
      mutation UpdateWorkspaceSettings(
        $workspaceId: ID!
        $name: String
        $motd: String
        $features: JSONObject
      ) {
        updateWorkspaceSettings(
          input: { workspaceId: $workspaceId, name: $name, motd: $motd, features: $features }
        ) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetNonPendingWorkspaces"],
    }
  );

  return updateWorkspaceSettings;
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
                logo
                invitationCode
                domain
                isDomainLimitedCode
                hasPaymentMethod
                isOrganization
                subscription {
                  status
                  trialEnds
                  effectiveUntil
                  plan {
                    key
                  }
                }
                settings {
                  motd
                  features
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
  const [updateWorkspaceCodeDomainLimitations] = useMutation<
    UpdateWorkspaceCodeDomainLimitations,
    UpdateWorkspaceCodeDomainLimitationsVariables
  >(
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
  const [deleteWorkspace] = useMutation<DeleteWorkspace, DeleteWorkspaceVariables>(
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
  const [addWorkspaceApiKey, { loading, error }] = useMutation<
    CreateWorkspaceAPIKey,
    CreateWorkspaceAPIKeyVariables
  >(ADD_WORKSPACE_API_KEY, {
    refetchQueries: ["GetWorkspaceApiKeys"],
  });

  return { addWorkspaceApiKey, loading, error };
}

export function useDeleteWorkspaceApiKey() {
  const [deleteWorkspaceApiKey, { loading, error }] = useMutation<
    DeleteWorkspaceAPIKey,
    DeleteWorkspaceAPIKeyVariables
  >(DELETE_WORKSPACE_API_KEY, {
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

export function useActivateWorkspaceSubscription(workspaceId: string) {
  const [activateWorkspaceSubscription, { loading, error }] = useMutation<{
    activateWorkspaceSubscription: {
      subscription: Pick<Subscription, "status" | "effectiveUntil">;
    };
  }>(ACTIVATE_WORKSPACE_SUBSCRIPTION, {
    variables: { workspaceId },
  });

  return { activateWorkspaceSubscription, loading, error };
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

export function useDeleteWorkspacePaymentMethod() {
  const [deleteWorkspacePaymentMethod, { loading, error }] = useMutation<
    any,
    { workspaceId: string; paymentMethodId: string }
  >(DELETE_WORKSPACE_PAYMENT_METHOD, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { deleteWorkspacePaymentMethod, loading, error };
}
