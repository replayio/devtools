import { gql, useMutation, useQuery } from "@apollo/client";

import { assert } from "protocol/utils";
import {
  ActivateWorkspaceSubscription,
  ActivateWorkspaceSubscriptionVariables,
} from "shared/graphql/generated/ActivateWorkspaceSubscription";
import {
  CancelWorkspaceSubscription,
  CancelWorkspaceSubscriptionVariables,
} from "shared/graphql/generated/CancelWorkspaceSubscription";
import {
  CreateNewWorkspace,
  CreateNewWorkspaceVariables,
  CreateNewWorkspace_createWorkspace_workspace,
} from "shared/graphql/generated/CreateNewWorkspace";
import {
  CreateWorkspaceAPIKey,
  CreateWorkspaceAPIKeyVariables,
} from "shared/graphql/generated/CreateWorkspaceAPIKey";
import {
  DeleteWorkspace,
  DeleteWorkspaceVariables,
} from "shared/graphql/generated/DeleteWorkspace";
import {
  DeleteWorkspaceAPIKey,
  DeleteWorkspaceAPIKeyVariables,
} from "shared/graphql/generated/DeleteWorkspaceAPIKey";
import {
  DeleteWorkspacePaymentMethod,
  DeleteWorkspacePaymentMethodVariables,
} from "shared/graphql/generated/DeleteWorkspacePaymentMethod";
import { GetNonPendingWorkspaces } from "shared/graphql/generated/GetNonPendingWorkspaces";
import { GetPendingWorkspaces } from "shared/graphql/generated/GetPendingWorkspaces";
import {
  GetWorkspaceApiKeys,
  GetWorkspaceApiKeysVariables,
} from "shared/graphql/generated/GetWorkspaceApiKeys";
import {
  GetWorkspaceSubscription,
  GetWorkspaceSubscriptionVariables,
} from "shared/graphql/generated/GetWorkspaceSubscription";
import {
  PrepareWorkspacePaymentMethod,
  PrepareWorkspacePaymentMethodVariables,
} from "shared/graphql/generated/PrepareWorkspacePaymentMethod";
import {
  SetWorkspaceDefaultPaymentMethod,
  SetWorkspaceDefaultPaymentMethodVariables,
} from "shared/graphql/generated/SetWorkspaceDefaultPaymentMethod";
import {
  UpdateWorkspaceCodeDomainLimitations,
  UpdateWorkspaceCodeDomainLimitationsVariables,
} from "shared/graphql/generated/UpdateWorkspaceCodeDomainLimitations";
import {
  UpdateWorkspaceLogo,
  UpdateWorkspaceLogoVariables,
} from "shared/graphql/generated/UpdateWorkspaceLogo";
import {
  UpdateWorkspaceMemberRole,
  UpdateWorkspaceMemberRoleVariables,
} from "shared/graphql/generated/UpdateWorkspaceMemberRole";
import {
  UpdateWorkspaceSettings,
  UpdateWorkspaceSettingsVariables,
} from "shared/graphql/generated/UpdateWorkspaceSettings";
import { PendingWorkspaceInvitation, Subscription, Workspace } from "shared/graphql/types";
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

const NO_WORKSPACES: Workspace[] = [];

export function useCreateNewWorkspace(
  onCompleted: (data: CreateNewWorkspace_createWorkspace_workspace) => void
) {
  const [createNewWorkspace, { error }] = useMutation<
    CreateNewWorkspace,
    CreateNewWorkspaceVariables
  >(
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
        assert(data.createWorkspace.workspace);
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
  const { data, loading, error } = useQuery<GetPendingWorkspaces>(
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

  let pendingWorkspaces: PendingWorkspaceInvitation[] = [];
  if (data?.viewer) {
    pendingWorkspaces = data.viewer.workspaceInvitations.edges.map(
      ({ node: { workspace, inviterEmail } }) => ({
        ...workspace,
        inviterEmail,
      })
    );
  }
  return { pendingWorkspaces, loading };
}

export function useGetWorkspace(workspaceId: string | null): {
  workspace?: Workspace | null;
  loading: boolean;
} {
  // TODO: We need a better way to do this but this'll do for now
  const { workspaces, loading } = useGetNonPendingWorkspaces();

  if (!workspaceId) {
    return { workspace: null, loading: false };
  }

  return {
    workspace: workspaces.find(ws => ws.id === workspaceId),
    loading,
  };
}

export function useUpdateWorkspaceLogo() {
  const [updateWorkspaceLogo] = useMutation<UpdateWorkspaceLogo, UpdateWorkspaceLogoVariables>(
    gql`
      mutation UpdateWorkspaceLogo($workspaceId: ID!, $format: String, $logo: String) {
        updateWorkspaceLogo(input: { workspaceId: $workspaceId, format: $format, logo: $logo }) {
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
    UpdateWorkspaceSettings,
    UpdateWorkspaceSettingsVariables
  >(
    gql`
      mutation UpdateWorkspaceSettings($workspaceId: ID!, $name: String, $features: JSONObject) {
        updateWorkspaceSettings(
          input: { workspaceId: $workspaceId, name: $name, features: $features }
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
  const { data, loading, error } = useQuery<GetNonPendingWorkspaces>(
    gql`
      query GetNonPendingWorkspaces {
        viewer {
          workspaces {
            edges {
              node {
                id
                name
                logo
                logoFormat
                invitationCode
                domain
                isDomainLimitedCode
                hasPaymentMethod
                isTest
                isOrganization
                isTest
                retentionLimit
                subscription {
                  status
                  trialEnds
                  effectiveUntil
                  plan {
                    key
                  }
                }
                settings {
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
    workspaces = data.viewer.workspaces.edges.map(({ node }) => {
      const members = node.members?.edges
        .filter(({ node }) => "user" in node)
        .map(({ node }) => {
          assert("user" in node, "No user in workspace member");
          return node.user;
        });
      return {
        ...node,
        subscription: node.subscription as Subscription | null,
        members,
      };
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
  const { data, loading, error } = useQuery<GetWorkspaceApiKeys, GetWorkspaceApiKeysVariables>(
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
    UpdateWorkspaceMemberRole,
    UpdateWorkspaceMemberRoleVariables
  >(UPDATE_WORKSPACE_MEMBER_ROLE, {
    refetchQueries: ["GetWorkspaceMembers"],
  });

  return { updateWorkspaceMemberRole, loading, error };
}

export function useActivateWorkspaceSubscription() {
  const [activateWorkspaceSubscription, { loading, error }] = useMutation<
    ActivateWorkspaceSubscription,
    ActivateWorkspaceSubscriptionVariables
  >(ACTIVATE_WORKSPACE_SUBSCRIPTION);

  return { activateWorkspaceSubscription, loading, error };
}

export function useGetWorkspaceSubscription(workspaceId: string) {
  const { data, loading, error, refetch } = useQuery<
    GetWorkspaceSubscription,
    GetWorkspaceSubscriptionVariables
  >(GET_WORKSPACE_SUBSCRIPTION, {
    variables: { workspaceId },
  });

  return { data, loading, error, refetch };
}

export function useCancelWorkspaceSubscription() {
  const [cancelWorkspaceSubscription, { loading, error }] = useMutation<
    CancelWorkspaceSubscription,
    CancelWorkspaceSubscriptionVariables
  >(CANCEL_WORKSPACE_SUBSCRIPTION, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { cancelWorkspaceSubscription, loading, error };
}

export function usePrepareWorkspacePaymentMethod() {
  const [prepareWorkspacePaymentMethod, { loading, error }] = useMutation<
    PrepareWorkspacePaymentMethod,
    PrepareWorkspacePaymentMethodVariables
  >(PREPARE_WORKSPACE_PAYMENT_METHOD, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { prepareWorkspacePaymentMethod, loading, error };
}

export function useSetWorkspaceDefaultPaymentMethod() {
  const [setWorkspaceDefaultPaymentMethod, { loading, error }] = useMutation<
    SetWorkspaceDefaultPaymentMethod,
    SetWorkspaceDefaultPaymentMethodVariables
  >(SET_WORKSPACE_DEFAULT_PAYMENT_METHOD, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { setWorkspaceDefaultPaymentMethod, loading, error };
}

export function useDeleteWorkspacePaymentMethod() {
  const [deleteWorkspacePaymentMethod, { loading, error }] = useMutation<
    DeleteWorkspacePaymentMethod,
    DeleteWorkspacePaymentMethodVariables
  >(DELETE_WORKSPACE_PAYMENT_METHOD, {
    refetchQueries: ["GetWorkspaceSubscription"],
  });

  return { deleteWorkspacePaymentMethod, loading, error };
}
