import { ApolloError, gql, useMutation, useQuery } from "@apollo/client";
import { RecordingId } from "@replayio/protocol";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";

import { assert } from "protocol/utils";
import { query } from "shared/graphql/apolloClient";
import {
  AcceptRecordingCollaboratorRequest,
  AcceptRecordingCollaboratorRequestVariables,
} from "shared/graphql/generated/AcceptRecordingCollaboratorRequest";
import {
  DeleteRecording,
  DeleteRecordingVariables,
} from "shared/graphql/generated/DeleteRecording";
import { GetMyRecordings_viewer_recordings_edges_node } from "shared/graphql/generated/GetMyRecordings";
import {
  GetOwnerAndCollaborators,
  GetOwnerAndCollaboratorsVariables,
} from "shared/graphql/generated/GetOwnerAndCollaborators";
import {
  GetRecording,
  GetRecordingVariables,
  GetRecording_recording,
} from "shared/graphql/generated/GetRecording";
import {
  getRecordingPhoto,
  getRecordingPhotoVariables,
} from "shared/graphql/generated/getRecordingPhoto";
import {
  GetRecordingPrivacy,
  GetRecordingPrivacyVariables,
} from "shared/graphql/generated/GetRecordingPrivacy";
import {
  GetRecordingUserId,
  GetRecordingUserIdVariables,
} from "shared/graphql/generated/GetRecordingUserId";
import { GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings } from "shared/graphql/generated/GetTestsRun";
import { GetWorkspaceRecordings_node_Workspace_recordings_edges_node } from "shared/graphql/generated/GetWorkspaceRecordings";
import { GetWorkspaceTestExecutions_node_Workspace_tests_edges_node_executions_recordings } from "shared/graphql/generated/GetWorkspaceTestExecutions";
import {
  InitializeRecording,
  InitializeRecordingVariables,
} from "shared/graphql/generated/InitializeRecording";
import {
  RequestRecordingAccess,
  RequestRecordingAccessVariables,
} from "shared/graphql/generated/RequestRecordingAccess";
import {
  SetRecordingIsPrivate,
  SetRecordingIsPrivateVariables,
} from "shared/graphql/generated/SetRecordingIsPrivate";
import {
  UpdateRecordingTitle,
  UpdateRecordingTitleVariables,
} from "shared/graphql/generated/UpdateRecordingTitle";
import {
  UpdateRecordingWorkspace,
  UpdateRecordingWorkspaceVariables,
} from "shared/graphql/generated/UpdateRecordingWorkspace";
import { Recording, RecordingRole, User, Workspace } from "shared/graphql/types";
import { getRecordingId } from "shared/utils/recording";
import { extractIdAndSlug } from "shared/utils/slug";
import { CollaboratorDbData } from "ui/components/shared/SharingModal/CollaboratorsList";
import { GET_RECORDING, GET_RECORDING_USER_ID, SUBSCRIBE_RECORDING } from "ui/graphql/recordings";
import { WorkspaceId } from "ui/state/app";

import { useGetUserId } from "./users";

function isTest() {
  return new URL(window.location.href).searchParams.get("test");
}

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

  return result.data?.recording ? convertRecording(result.data.recording) : undefined;
}

export function useGetRecording(recordingId: RecordingId | null | undefined): {
  recording: Recording | undefined;
  isAuthorized: boolean;
  loading: boolean;
  refetch: () => void;
} {
  const { data, error, loading, refetch } = useQuery<GetRecording, GetRecordingVariables>(
    GET_RECORDING,
    {
      variables: { recordingId },
      skip: !recordingId,
    }
  );

  if (error) {
    console.error("Apollo error while getting the recording", error);
  }

  const recording = useMemo(
    () => (data?.recording ? convertRecording(data.recording) : undefined),
    [data]
  );

  // Tests don't have an associated user so we just let it bypass the check here.
  const isAuthorized = isTest() || recording;

  return { recording, isAuthorized: !!isAuthorized, loading, refetch };
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
    | GetTestsRun_node_Workspace_testRuns_edges_node_tests_recordings
    | GetWorkspaceTestExecutions_node_Workspace_tests_edges_node_executions_recordings
): Recording {
  const recording: Recording = {
    buildId: "buildId" in rec ? rec.buildId : undefined,
    id: rec.uuid,
    user: "owner" in rec ? rec.owner : undefined,
    userId: "owner" in rec ? rec.owner?.id : undefined,
    // NOTE: URLs are nullable in the database
    url: "url" in rec ? rec.url || "" : "",
    title: "title" in rec ? rec.title : undefined,
    duration: rec.duration,
    private: "private" in rec ? rec.private : undefined,
    isProcessed: "isProcessed" in rec ? rec.isProcessed ?? undefined : undefined,
    isInitialized: "isInitialized" in rec ? rec.isInitialized : undefined,
    date: rec.createdAt,
    comments: "comments" in rec ? rec.comments : [],
    userRole: "userRole" in rec ? (rec.userRole as RecordingRole) : undefined,
    isTest: "isTest" in rec ? rec.isTest : undefined,
    isInTestWorkspace: "isInTestWorkspace" in rec ? rec.isInTestWorkspace : undefined,
    testRunId: null,
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
    recording.collaboratorRequests = rec.collaboratorRequests?.edges.map(({ node }) => ({
      id: node.id,
      // TODO GetRecording_recording_collaboratorRequests_edges does not have an "id" field
      user: node.user as unknown as User,
    }));
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
  if ("testRun" in rec) {
    recording.testRunId = rec.testRun?.id ?? null;
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

const EMPTY_ARRAY = [] as any[];

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

export function useUpdateRecordingWorkspace() {
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

  return async (recordingId: RecordingId, targetWorkspaceId: WorkspaceId | null) => {
    await updateRecordingWorkspace({
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
  } = (await resp.json()) as any;

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
