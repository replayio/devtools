import { RecordingId } from "@recordreplay/protocol";
import { ApolloError, gql, useQuery, useMutation } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { Recording } from "ui/types";
import { WorkspaceId } from "ui/state/app";
import { CollaboratorDbData } from "ui/components/shared/SharingModal/CollaboratorsList";
import { useGetUserId } from "./users";
import { GET_RECORDING, GET_RECORDING_USER_ID } from "ui/graphql/recordings";
import { useRouter } from "next/router";
import { extractIdAndSlug } from "ui/utils/helpers";
import { getRecordingId } from "ui/utils/recording";
import { ColorSwatchIcon } from "@heroicons/react/solid";
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
import { GetRecording, GetRecordingVariables } from "graphql/GetRecording";
import { GetRecordingUserId, GetRecordingUserIdVariables } from "graphql/GetRecordingUserId";
import { GetMyRecordings } from "graphql/GetMyRecordings";
import { getRecordingPhoto, getRecordingPhotoVariables } from "graphql/getRecordingPhoto";
import {
  GetOwnerAndCollaborators,
  GetOwnerAndCollaboratorsVariables,
} from "graphql/GetOwnerAndCollaborators";
import { GetRecordingPrivacy, GetRecordingPrivacyVariables } from "graphql/GetRecordingPrivacy";
import {
  GetWorkspaceRecordings,
  GetWorkspaceRecordingsVariables,
} from "graphql/GetWorkspaceRecordings";
import { useMemo } from "react";

function isTest() {
  return new URL(window.location.href).searchParams.get("test");
}

const GET_WORKSPACE_RECORDINGS = gql`
  query GetWorkspaceRecordings($workspaceId: ID!) {
    node(id: $workspaceId) {
      ... on Workspace {
        id
        recordings {
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
  query GetMyRecordings {
    viewer {
      recordings {
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
  const result = await query({
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

function convertRecording(rec: any): Recording | undefined {
  if (!rec) {
    return undefined;
  }

  const collaborators = rec.collaborators?.edges
    ?.filter((e: any) => e.node.user)
    .map((e: any) => e.node.user.id);
  const collaboratorRequests = rec.collaboratorRequests?.edges.map((e: any) => e.node);

  return {
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
    workspace: rec.workspace,
    comments: rec.comments,
    collaborators,
    collaboratorRequests,
    ownerNeedsInvite: rec.ownerNeedsInvite,
    userRole: rec.userRole,
    operations: rec.operations,
    resolution: rec.resolution,
  };
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
  recording: Recording | undefined;
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
    return { collaborators: null, recording: undefined, loading, error };
  }

  if (error) {
    console.error("Apollo error while getting owners and collaborators", error);
  }

  let collaborators: CollaboratorDbData[] = [];
  if (data?.recording?.collaborators) {
    collaborators = data.recording.collaborators.edges
      .map(({ node }: any) => ({
        collaborationId: node.id,
        user: node.user,
        email: node.email,
        createdAt: node.createdAt,
      }))
      .sort(
        (a: CollaboratorDbData, b: CollaboratorDbData) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  const recording = convertRecording(data?.recording);
  return { collaborators, recording, loading, error };
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
    `,
    { refetchQueries: ["GetRecording"] }
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

export function useGetPersonalRecordings():
  | { recordings: null; loading: true }
  | { recordings: Recording[]; loading: false } {
  const { data, error, loading } = useQuery<GetMyRecordings>(GET_MY_RECORDINGS, {
    pollInterval: 5000,
  });

  if (loading) {
    return { recordings: null, loading };
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
  }

  let recordings: any = [];
  if (data?.viewer) {
    recordings = data.viewer.recordings.edges.map(({ node }: any) => convertRecording(node));
  }
  return { recordings, loading };
}

export function useGetWorkspaceRecordings(
  currentWorkspaceId: WorkspaceId
): { recordings: null; loading: true } | { recordings: Recording[]; loading: false } {
  const { data, error, loading } = useQuery<
    GetWorkspaceRecordings,
    GetWorkspaceRecordingsVariables
  >(GET_WORKSPACE_RECORDINGS, {
    variables: { workspaceId: currentWorkspaceId },
    pollInterval: 5000,
  });

  if (loading) {
    return { recordings: null, loading };
  }

  if (error) {
    console.error("Failed to fetch recordings:", error);
  }

  let recordings: Recording[] = [];

  // @ts-ignore
  const recordingsData = data?.node?.recordings;
  if (recordingsData) {
    recordings = recordingsData.edges.map(({ node }: any) => convertRecording(node));
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

  if (!isOptimistic) {
    return (
      recordingId: RecordingId,
      currentWorkspaceId: WorkspaceId | null,
      targetWorkspaceId: WorkspaceId | null
    ) => updateRecordingWorkspace({ variables: { recordingId, workspaceId: targetWorkspaceId } });
  }

  return (
    recordingId: RecordingId,
    currentWorkspaceId: WorkspaceId | null,
    targetWorkspaceId: WorkspaceId | null
  ) => {
    updateRecordingWorkspace({
      variables: { recordingId, workspaceId: targetWorkspaceId },
      update: store => {
        const recordingsToTransfer = [];
        // Immediately remove the recording from the current workspace
        if (currentWorkspaceId) {
          const data: any = store.readQuery({
            query: GET_WORKSPACE_RECORDINGS,
            variables: { workspaceId: currentWorkspaceId },
          });

          const newEdges = data.node.recordings.edges.filter(
            (edge: any) => edge.node.uuid !== recordingId
          );
          const newData = {
            ...data,
            node: {
              ...data.node,
              recordings: {
                ...data.node.recordings,
                edges: newEdges,
              },
            },
          };

          recordingsToTransfer.push(
            ...data.node.recordings.edges.filter((edge: any) => edge.node.uuid === recordingId)
          );

          store.writeQuery({
            query: GET_WORKSPACE_RECORDINGS,
            data: newData,
            variables: { workspaceID: currentWorkspaceId },
          });
        } else {
          const data: any = store.readQuery({
            query: GET_MY_RECORDINGS,
          });

          const newEdges = data.viewer.recordings.edges.filter(
            (edge: any) => edge.node.uuid !== recordingId
          );
          const newData = {
            ...data,
            viewer: {
              ...data.viewer,
              recordings: {
                ...data.viewer.recordings,
                edges: newEdges,
              },
            },
          };

          recordingsToTransfer.push(
            ...data.viewer.recordings.edges.filter((edge: any) => edge.node.uuid === recordingId)
          );

          store.writeQuery({
            query: GET_MY_RECORDINGS,
            data: newData,
          });
        }

        // Update the new targetWorkspace's associated query in the cache.
        if (targetWorkspaceId) {
          let data: any = null;

          try {
            data = store.readQuery({
              query: GET_WORKSPACE_RECORDINGS,
              variables: { workspaceId: targetWorkspaceId },
            });
          } catch (e) {}

          // Bail if this query doesn't already exist in the cache
          if (!data) {
            return;
          }

          const newData = {
            ...data,
            node: {
              ...data.node,
              recordings: {
                ...data.node.recordings,
                edges: [...data.node.recordings.edges, ...recordingsToTransfer],
              },
            },
          };

          store.writeQuery({
            query: GET_WORKSPACE_RECORDINGS,
            data: newData,
            variables: { workspaceID: targetWorkspaceId },
          });
        } else {
          let data: any = null;

          try {
            data = store.readQuery({
              query: GET_MY_RECORDINGS,
            });
          } catch (e) {}

          // Bail if this query doesn't already exist in the cache
          if (!data) {
            return;
          }

          const newData = {
            ...data,
            viewer: {
              ...data.viewer,
              recordings: {
                ...data.viewer.recordings,
                edges: [...data.viewer.recordings.edges, ...recordingsToTransfer],
              },
            },
          };

          store.writeQuery({
            query: GET_MY_RECORDINGS,
            data: newData,
          });
        }
      },
      optimisticResponse: {
        updateRecordingWorkspace: {
          recording: {
            uuid: recordingId,
            __typename: "Recording",
            workspace: { __typename: "Workspace", id: targetWorkspaceId! },
          },
          success: true,
          __typename: "UpdateRecordingWorkspace",
        },
      },
    });
  };
}

export function useGetMyRecordings() {
  return useGetPersonalRecordings();
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
      optimisticResponse: {
        deleteRecording: {
          success: true,
          __typename: "DeleteRecording",
        },
      },
      update: store => {
        if (workspaceId) {
          const data: any = store.readQuery({
            query: GET_WORKSPACE_RECORDINGS,
            variables: { workspaceId },
          });

          const newEdges = data.node.recordings.edges.filter(
            (edge: any) => edge.node.uuid !== recordingId
          );
          const newData = {
            ...data,
            node: {
              ...data.node,
              recordings: {
                ...data.node.recordings,
                edges: newEdges,
              },
            },
          };

          store.writeQuery({
            query: GET_WORKSPACE_RECORDINGS,
            data: newData,
          });

          return;
        }

        const data: any = store.readQuery({
          query: GET_MY_RECORDINGS,
        });

        const newEdges = data.viewer.recordings.edges.filter(
          (edge: any) => edge.node.uuid !== recordingId
        );
        const newData = {
          ...data,
          viewer: {
            ...data.viewer,
            recordings: {
              ...data.viewer.recordings,
              edges: newEdges,
            },
          },
        };

        store.writeQuery({
          query: GET_MY_RECORDINGS,
          data: newData,
        });
      },
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
    `,
    { refetchQueries: ["GetRecording"] }
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
    `,
    {
      refetchQueries: ["GetRecording"],
    }
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
  const [updateRecordingResolution] = useMutation(
    gql`
      mutation UpdateRecordingResolution($id: ID!, $isResolved: Boolean!) {
        updateRecordingResolution(input: { id: $id, isResolved: $isResolved }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetRecording"],
    }
  );

  return (isResolved: boolean) =>
    updateRecordingResolution({ variables: { id: recordingId, isResolved } });
}
