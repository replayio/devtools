import { ApolloError, gql, useQuery, useMutation } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { Recording, RecordingRole, User, Workspace } from "ui/types";
import { WorkspaceId } from "ui/state/app";
import { CollaboratorDbData } from "ui/components/shared/SharingModal/CollaboratorsList";
import { useGetUserId } from "./users";
import { GET_RECORDING, GET_RECORDING_USER_ID, SUBSCRIBE_RECORDING } from "ui/graphql/recordings";
import { useRouter } from "next/router";
import { extractIdAndSlug } from "ui/utils/helpers";
import { getRecordingId } from "ui/utils/recording";
import { RecordingId } from "@replayio/protocol";
import {
  SetRecordingIsPrivate,
  SetRecordingIsPrivateVariables,
} from "graphql/SetRecordingIsPrivate";
import {
  UpdateRecordingWorkspace,
  UpdateRecordingWorkspaceVariables,
} from "graphql/UpdateRecordingWorkspace";
import { DeleteRecording, DeleteRecordingVariables } from "graphql/DeleteRecording";
import { InitializeRecording, InitializeRecordingVariables } from "graphql/InitializeRecording";
import { UpdateRecordingTitle, UpdateRecordingTitleVariables } from "graphql/UpdateRecordingTitle";
import {
  RequestRecordingAccess,
  RequestRecordingAccessVariables,
} from "graphql/RequestRecordingAccess";
import {
  AcceptRecordingCollaboratorRequest,
  AcceptRecordingCollaboratorRequestVariables,
} from "graphql/AcceptRecordingCollaboratorRequest";
import { GetRecording, GetRecordingVariables, GetRecording_recording } from "graphql/GetRecording";
import { GetRecordingUserId, GetRecordingUserIdVariables } from "graphql/GetRecordingUserId";
import {
  GetMyRecordings,
  GetMyRecordingsVariables,
  GetMyRecordings_viewer_recordings_edges_node,
} from "graphql/GetMyRecordings";
import { getRecordingPhoto, getRecordingPhotoVariables } from "graphql/getRecordingPhoto";
import {
  GetOwnerAndCollaborators,
  GetOwnerAndCollaboratorsVariables,
} from "graphql/GetOwnerAndCollaborators";
import { GetRecordingPrivacy, GetRecordingPrivacyVariables } from "graphql/GetRecordingPrivacy";
import {
  GetWorkspaceRecordings,
  GetWorkspaceRecordingsVariables,
  GetWorkspaceRecordings_node_Workspace_recordings_edges,
  GetWorkspaceRecordings_node_Workspace_recordings_edges_node,
} from "graphql/GetWorkspaceRecordings";
import { useEffect, useMemo } from "react";
import { assert } from "protocol/utils";
import {
  UpdateRecordingResolution,
  UpdateRecordingResolutionVariables,
} from "graphql/UpdateRecordingResolution";

function isTest() {
  return new URL(window.location.href).searchParams.get("test");
}

const GET_WORKSPACE_RECORDINGS = gql`
  query GetWorkspaceRecordings($workspaceId: ID!, $filter: String) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        recordings(filter: $filter) {
          edges {
            node {
              uuid
              url
              title
              duration
              createdAt
              private
              isInitialized
              userRole
              metadata
              comments {
                user {
                  id
                }
              }
              owner {
                id
                name
                picture
              }
              comments {
                user {
                  id
                }
              }
              workspace {
                id
                hasPaymentMethod
                subscription {
                  status
                  trialEnds
                  effectiveUntil
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_MY_RECORDINGS = gql`
  query GetMyRecordings($filter: String) {
    viewer {
      recordings(filter: $filter) {
        edges {
          node {
            uuid
            url
            title
            duration
            createdAt
            private
            isInitialized
            userRole
            owner {
              id
              name
              picture
            }
            comments {
              user {
                id
              }
            }
            collaborators {
              edges {
                node {
                  ... on RecordingUserCollaborator {
                    id
                    user {
                      id
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
`;

export function useGetRawRecordingIdWithSlug() {
  return useRouter().query.id;
}

export function useGetRecordingId() {
  const { id } = useRouter().query;
  return extractIdAndSlug(id).id!;
}

export async function getRecording(recordingId: RecordingId) {
  const result = await query<GetRecording, GetRecordingVariables>({
    query: GET_RECORDING,
    variables: { recordingId },
  });

  return convertRecording(result.data?.recording);
}

export function useGetRecording(recordingId: RecordingId | null | undefined): {
  recording: Recording | undefined;
  isAuthorized: boolean;
  loading: boolean;
} {
  const { data, error, loading } = useQuery<GetRecording, GetRecordingVariables>(GET_RECORDING, {
    variables: { recordingId },
    skip: !recordingId,
  });

  if (error) {
    console.error("Apollo error while getting the recording", error);
  }

  const recording = useMemo(() => convertRecording(data?.recording), [data]);

  // Tests don't have an associated user so we just let it bypass the check here.
  const isAuthorized = isTest() || recording;

  return { recording, isAuthorized: !!isAuthorized, loading };
}

export function useSubscribeRecording(recordingId: RecordingId | null | undefined) {
  const { subscribeToMore } = useQuery<GetRecording, GetRecordingVariables>(GET_RECORDING, {
    variables: { recordingId },
    skip: !recordingId,
  });
  useEffect(
    () =>
      subscribeToMore({
        document: SUBSCRIBE_RECORDING,
        variables: { recordingId },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData) {
            return prev;
          }
          return Object.assign({}, prev, subscriptionData.data.recording);
        },
      }),
    [recordingId, subscribeToMore]
  );
}

export function useIsTeamDeveloper() {
  const recordingId = getRecordingId();
  const { data, error, loading } = useQuery<GetRecording, GetRecordingVariables>(GET_RECORDING, {
    variables: { recordingId },
  });

  if (error) {
    console.error("Apollo error while getting the user's role", error);
  }

  return { isTeamDeveloper: data?.recording?.userRole !== "team-user", loading };
}

// If the user has no role, then they're either viewing a non-team recording they
// don't own, or a team recording for a team that they don't belong to.
export function useHasNoRole() {
  const recordingId = getRecordingId();
  const { data, error, loading } = useQuery<GetRecording, GetRecordingVariables>(GET_RECORDING, {
    variables: { recordingId },
  });

  if (error) {
    console.error("Apollo error while getting the user's role", error);
  }

  return { hasNoRole: data?.recording?.userRole === "none", loading };
}

export function convertRecording(
  rec:
    | GetRecording_recording
    | GetMyRecordings_viewer_recordings_edges_node
    | GetWorkspaceRecordings_node_Workspace_recordings_edges_node
    | null
    | undefined
): Recording | undefined {
  if (!rec) {
    return undefined;
  }

  const recording: Recording = {
    id: rec.uuid,
    user: rec.owner,
    userId: rec.owner?.id,
    // NOTE: URLs are nullable in the database
    url: rec.url || "",
    title: rec.title,
    duration: rec.duration,
    private: rec.private,
    isInitialized: rec.isInitialized,
    date: rec.createdAt,
    comments: rec.comments,
    userRole: rec.userRole as RecordingRole,
  };

  if ("workspace" in rec) {
    recording.workspace = rec.workspace as Workspace;
  }
  if ("collaborators" in rec) {
    recording.collaborators = rec.collaborators?.edges
      ?.filter(({ node }) => "user" in node && node.user)
      .map(({ node }) => {
        assert("user" in node);
        return node.user.id;
      });
  }
  if ("collaboratorRequests" in rec) {
    recording.collaboratorRequests = rec.collaboratorRequests?.edges.map(({ node }) => node);
  }
  if ("ownerNeedsInvite" in rec) {
    recording.ownerNeedsInvite = rec.ownerNeedsInvite;
  }
  if ("operations" in rec) {
    recording.operations = rec.operations;
  }
  if ("resolution" in rec) {
    recording.resolution = rec.resolution;
  }
  if ("metadata" in rec) {
    recording.metadata = rec.metadata;
  }
  if ("userRole" in rec) {
    recording.userRole = rec.userRole as RecordingRole;
  }

  return recording;
}

export function useGetRecordingPhoto(recordingId: RecordingId): {
  error: ApolloError | undefined;
  loading: boolean;
  screenData?: string;
} {
  const { data, loading, error } = useQuery<getRecordingPhoto, getRecordingPhotoVariables>(
    gql`
      query getRecordingPhoto($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          thumbnail
        }
      }
    `,
    { variables: { recordingId } }
  );

  if (!data) {
    return { loading, error };
  }

  if (error) {
    console.error("Apollo error while getting user photo", error);
  }

  const screenData = data.recording?.thumbnail;
  return { error, loading, screenData: screenData ?? undefined };
}

export function useGetOwnersAndCollaborators(recordingId: RecordingId): {
  error: ApolloError | undefined;
  loading: boolean;
  owner: User | null | undefined;
  collaborators: CollaboratorDbData[] | null;
} {
  const { data, loading, error } = useQuery<
    GetOwnerAndCollaborators,
    GetOwnerAndCollaboratorsVariables
  >(
    gql`
      query GetOwnerAndCollaborators($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          owner {
            id
            name
            picture
          }
          collaborators {
            edges {
              node {
                ... on RecordingPendingEmailCollaborator {
                  id
                  email
                  createdAt
                }
                ... on RecordingPendingUserCollaborator {
                  id
                  createdAt
                  user {
                    id
                    name
                    picture
                  }
                }
                ... on RecordingUserCollaborator {
                  id
                  createdAt
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
    `,
    {
      variables: { recordingId },
    }
  );

  if (loading) {
    return { collaborators: null, owner: undefined, loading, error };
  }

  if (error) {
    console.error("Apollo error while getting owners and collaborators", error);
  }

  let collaborators: CollaboratorDbData[] = [];
  if (data?.recording?.collaborators) {
    collaborators = data.recording.collaborators.edges
      .map(({ node }) => ({
        collaborationId: node.id,
        user: "user" in node ? node.user : undefined,
        email: "email" in node ? node.email : undefined,
        createdAt: node.createdAt,
      }))
      .sort(
        (a: CollaboratorDbData, b: CollaboratorDbData) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  const owner = data?.recording?.owner;

  return { collaborators, owner, loading, error };
}

export function useGetIsPrivate(recordingId: RecordingId) {
  const { data, loading, error } = useQuery<GetRecordingPrivacy, GetRecordingPrivacyVariables>(
    gql`
      query GetRecordingPrivacy($recordingId: UUID!) {
        recording(uuid: $recordingId) {
          uuid
          private
        }
      }
    `,
    {
      variables: { recordingId },
    }
  );

  if (loading) {
    return { isPrivate: null, loading, error };
  }

  if (error) {
    console.error("Apollo error while getting isPrivate", error);
  }

  const isPrivate = data?.recording?.private;

  return { isPrivate, loading, error };
}

export function useUpdateIsPrivate() {
  const [updateIsPrivate] = useMutation<SetRecordingIsPrivate, SetRecordingIsPrivateVariables>(
    gql`
      mutation SetRecordingIsPrivate($recordingId: ID!, $isPrivate: Boolean!) {
        updateRecordingPrivacy(input: { id: $recordingId, private: $isPrivate }) {
          success
        }
      }
    `
  );

  return (recordingId: string, isPrivate: boolean) =>
    updateIsPrivate({ variables: { recordingId, isPrivate } });
}

export function useIsOwner() {
  const recordingId = useGetRecordingId();
  const { userId } = useGetUserId();
  const { data, loading, error } = useQuery<GetRecordingUserId, GetRecordingUserIdVariables>(
    GET_RECORDING_USER_ID,
    {
      variables: { recordingId },
    }
  );

  if (loading) {
    return false;
  }

  if (error) {
    console.error("Apollo error while getting isOwner", error);
    return false;
  }

  const recording = data?.recording;
  if (!recording?.owner) {
    return false;
  }

  return userId === recording.owner.id;
}

export function useGetPersonalRecordings(
  filter: string
): { recordings: null; loading: true } | { recordings: Recording[]; loading: false } {
  const { data, error, loading } = useQuery<GetMyRecordings, GetMyRecordingsVariables>(
    GET_MY_RECORDINGS,
    {
      pollInterval: 5000,
      variables: { filter },
    }
  );

  if (loading) {
    return { recordings: null, loading };
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
  }

  let recordings: Recording[] = [];
  if (data?.viewer) {
    recordings = data.viewer.recordings.edges.map(({ node }) => convertRecording(node)!);
  }
  return { recordings, loading };
}

export function useGetWorkspaceRecordings(
  currentWorkspaceId: WorkspaceId,
  filter: string
): { recordings: null; loading: true } | { recordings: Recording[]; loading: false } {
  const { data, error, loading } = useQuery<
    GetWorkspaceRecordings,
    GetWorkspaceRecordingsVariables
  >(GET_WORKSPACE_RECORDINGS, {
    variables: { workspaceId: currentWorkspaceId, filter },
    pollInterval: 5000,
  });

  if (loading) {
    return { recordings: null, loading };
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
  }

  let recordings: Recording[] = [];

  if (data?.node && "recordings" in data.node && data.node.recordings) {
    recordings = data.node.recordings.edges.map(({ node }) => convertRecording(node)!);
  }

  return { recordings, loading };
}

export function useUpdateRecordingWorkspace(isOptimistic: boolean = true) {
  const [updateRecordingWorkspace] = useMutation<
    UpdateRecordingWorkspace,
    UpdateRecordingWorkspaceVariables
  >(
    gql`
      mutation UpdateRecordingWorkspace($recordingId: ID!, $workspaceId: ID) {
        updateRecordingWorkspace(input: { id: $recordingId, workspaceId: $workspaceId }) {
          success
          recording {
            uuid
            workspace {
              id
            }
          }
        }
      }
    `
  );

  return (
    recordingId: RecordingId,
    currentWorkspaceId: WorkspaceId | null,
    targetWorkspaceId: WorkspaceId | null
  ) => {
    updateRecordingWorkspace({
      variables: { recordingId, workspaceId: targetWorkspaceId },
      refetchQueries: ["GetMyRecordings", "GetWorkspaceRecordings"],
    });
  };
}

const DELETE_RECORDING = gql`
  mutation DeleteRecording($recordingId: ID!) {
    deleteRecording(input: { id: $recordingId }) {
      success
    }
  }
`;

export function useDeleteRecording(onCompleted: () => void) {
  const [deleteRecording] = useMutation<DeleteRecording, DeleteRecordingVariables>(
    DELETE_RECORDING,
    {
      onCompleted,
    }
  );

  return deleteRecording;
}

export function useDeleteRecordingFromLibrary() {
  const [deleteRecording] = useMutation<DeleteRecording, DeleteRecordingVariables>(
    DELETE_RECORDING
  );

  return (recordingId: RecordingId, workspaceId: WorkspaceId | null) => {
    deleteRecording({
      variables: { recordingId },
      refetchQueries: ["GetMyRecordings", "GetWorkspaceRecordings"],
    });
  };
}

export function useInitializeRecording() {
  const [initializeRecording] = useMutation<InitializeRecording, InitializeRecordingVariables>(
    gql`
      mutation InitializeRecording($recordingId: ID!, $title: String!, $workspaceId: ID) {
        initializeRecording(input: { id: $recordingId, title: $title, workspaceId: $workspaceId }) {
          success
          recording {
            uuid
            isInitialized
            title
            workspace {
              id
            }
          }
        }
      }
    `
  );

  return initializeRecording;
}

export function useUpdateRecordingTitle() {
  const [updateRecordingTitle] = useMutation<UpdateRecordingTitle, UpdateRecordingTitleVariables>(
    gql`
      mutation UpdateRecordingTitle($recordingId: ID!, $title: String!) {
        updateRecordingTitle(input: { id: $recordingId, title: $title }) {
          success
          recording {
            uuid
            title
          }
        }
      }
    `
  );

  return (recordingId: string, title: string) =>
    updateRecordingTitle({ variables: { recordingId, title } });
}

export async function getRecordingMetadata(id: string) {
  const resp = await fetch(process.env.NEXT_PUBLIC_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query GetRecordingMetadata($recordingId: UUID!) {
          recording(uuid: $recordingId) {
            url
            title
            duration
            private
            isInitialized
            owner {
              name
            }
            workspace {
              name
            }
          }
        }
      `,
      variables: {
        recordingId: id,
      },
    }),
  });

  const json: {
    data: { recording: Recording & { owner?: { name: string } } };
    error: any;
  } = await resp.json();

  if (json.error || !json.data.recording) {
    return null;
  }

  return {
    id,
    title: json.data.recording.title,
    url: json.data.recording.url,
    duration: json.data.recording.duration,
    owner: json.data.recording.owner?.name || null,
  };
}

export function useRequestRecordingAccess() {
  const recordingId = useGetRecordingId();

  const [requestRecordingAccess] = useMutation<
    RequestRecordingAccess,
    RequestRecordingAccessVariables
  >(
    gql`
      mutation RequestRecordingAccess($recordingId: ID!) {
        requestRecordingAccess(input: { recordingId: $recordingId }) {
          success
        }
      }
    `
  );

  return () => requestRecordingAccess({ variables: { recordingId } });
}

export function useAcceptRecordingRequest() {
  const [acceptRecordingRequest] = useMutation<
    AcceptRecordingCollaboratorRequest,
    AcceptRecordingCollaboratorRequestVariables
  >(
    gql`
      mutation AcceptRecordingCollaboratorRequest($requestId: ID!) {
        acceptRecordingCollaboratorRequest(input: { id: $requestId }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetRecording"],
    }
  );

  return (requestId: string) => acceptRecordingRequest({ variables: { requestId } });
}

export function useUpdateRecordingResolution(recordingId: RecordingId) {
  const [updateRecordingResolution] = useMutation<
    UpdateRecordingResolution,
    UpdateRecordingResolutionVariables
  >(
    gql`
      mutation UpdateRecordingResolution($id: ID!, $isResolved: Boolean!) {
        updateRecordingResolution(input: { id: $id, isResolved: $isResolved }) {
          success
        }
      }
    `
  );

  return (isResolved: boolean) =>
    updateRecordingResolution({ variables: { id: recordingId, isResolved } });
}
