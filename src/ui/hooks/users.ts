import { gql, useMutation, useQuery } from "@apollo/client";
import { mutate, query } from "ui/utils/apolloClient";
import { GET_USER_INFO, GET_USER_ID, DISMISS_NAG } from "ui/graphql/users";
import { getRecordingId } from "ui/utils/recording";
import { sendTelemetryEvent } from "ui/utils/telemetry";
import { useGetRecording } from "./recordings";
import { Recording, Workspace } from "ui/types";
import { useGetNonPendingWorkspaces } from "./workspaces";
import { DismissNag, DismissNagVariables } from "graphql/DismissNag";
import { subscribeToEmailType, subscribeToEmailTypeVariables } from "graphql/subscribeToEmailType";
import {
  unsubscribeToEmailType,
  unsubscribeToEmailTypeVariables,
} from "graphql/unsubscribeToEmailType";
import { AcceptTOS, AcceptTOSVariables } from "graphql/AcceptTOS";

export async function getUserId() {
  const result = await query({
    query: GET_USER_ID,
    variables: {},
  });
  return result?.data?.viewer?.user?.id;
}

export async function dismissNag(nag: Nag) {
  await mutate({
    mutation: DISMISS_NAG,
    variables: { nag },
    refetchQueries: ["GetUser"],
  });
}

export function useGetUserId() {
  const { data, loading, error } = useQuery(GET_USER_ID);
  return { userId: data?.viewer?.user.id, loading, error };
}

export function useUserIsAuthor() {
  const { recording, loading: loading1 } = useGetRecording(getRecordingId());
  const { userId, loading: loading2 } = useGetUserId();

  if (loading1 || loading2) {
    return { userIsAuthor: null, loading: true };
  }

  return { userIsAuthor: userId && userId === recording?.userId, loading: false };
}

export type UserInfo = {
  motd: string | null;
  acceptedTOSVersion: number | null;
  name: string;
  picture: string;
  email: string;
  id: string;
  internal: boolean;
  nags: Nag[];
  unsubscribedEmailTypes: EmailSubscription[];
  features: { library: boolean };
};

export enum Nag {
  FIRST_LOG_IN = "first_log_in",
  FIRST_REPLAY_2 = "first_replay_2",
  FIRST_BREAKPOINT_EDIT = "first_breakpoint_edit",
  FIRST_BREAKPOINT_ADD = "first_breakpoint_add",
  FIRST_BREAKPOINT_SAVE = "first_breakpoint_save",
  FIRST_CONSOLE_NAVIGATE = "first_console_navigate",
  DOWNLOAD_REPLAY = "download_replay",
}

// Keeping a list of unused nag types here so we don't accidentally
// overwrite them as we come up with new ones.
enum DeprecatedNag {
  FIRST_REPLAY = "first_replay",
  FIRST_BREAKPOINT_REMOVED = "first_breakpoint_removed",
  FIRST_GUTTER_CLICK = "first_gutter_click",
}

export enum EmailSubscription {
  COLLABORATOR_REQUEST = "collaborator_request",
  REPLAY_COMMENT = "replay_comment",
  NEW_TEAM_INVITE = "new_team_invite",
}

export async function getUserInfo(): Promise<UserInfo | undefined> {
  const result = await query({
    query: GET_USER_INFO,
    variables: {},
  });
  const viewer = result?.data?.viewer;
  if (!viewer) {
    return undefined;
  }
  if (!viewer.user) {
    sendTelemetryEvent("UnexpectedGraphQLResult", { result });
    return undefined;
  }
  return {
    name: viewer.user.name,
    picture: viewer.user.picture,
    motd: viewer.motd,
    acceptedTOSVersion: viewer.acceptedTOSVersion,
    email: viewer.email,
    id: viewer.user.id,
    internal: viewer.internal,
    nags: viewer.nags,
    unsubscribedEmailTypes: viewer.unsubscribedEmailTypes,
    features: viewer.features || {},
  };
}

export function useGetUserInfo(): UserInfo & { loading: boolean } {
  const { data, loading, error } = useQuery(GET_USER_INFO);

  if (error) {
    console.error("Apollo error while fetching user:", error);
  }

  const id: string = data?.viewer?.user.id;
  const picture: string = data?.viewer?.user.picture;
  const name: string = data?.viewer?.user.name;
  const email: string = data?.viewer?.email;
  const internal: boolean = data?.viewer?.internal;
  const nags: Nag[] = data?.viewer?.nags;
  const unsubscribedEmailTypes: EmailSubscription[] = data?.viewer?.unsubscribedEmailTypes;
  const acceptedTOSVersion = data?.viewer?.acceptedTOSVersion;
  const motd: string = data?.viewer?.motd;
  const features = data?.viewer?.features || {};

  return {
    loading,
    id,
    email,
    picture,
    name,
    internal,
    nags,
    acceptedTOSVersion,
    unsubscribedEmailTypes,
    motd,
    features,
  };
}

export function useDismissNag() {
  const { id, nags } = useGetUserInfo();
  const [dismissNag, { error }] = useMutation<DismissNag, DismissNagVariables>(DISMISS_NAG, {
    refetchQueries: ["GetUser"],
  });

  if (error) {
    console.error("Apollo error while updating the user's nags:", error);
  }

  return (nag: Nag) => {
    if (!nags || nags.includes(nag) || !id) {
      return;
    }

    dismissNag({
      variables: { nag },
    });
  };
}

export function useSubscribeToEmailType() {
  const [subscribeToEmailType, { error }] = useMutation<
    subscribeToEmailType,
    subscribeToEmailTypeVariables
  >(
    gql`
      mutation subscribeToEmailType($emailType: String!) {
        subscribeToEmailType(input: { emailType: $emailType }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetUser"] }
  );

  if (error) {
    console.error("Apollo error while updating the user's email preferences:", error);
  }

  return (emailType: EmailSubscription) => subscribeToEmailType({ variables: { emailType } });
}
export function useUnsubscribeToEmailType() {
  const [unsubscribeToEmailType, { error }] = useMutation<
    unsubscribeToEmailType,
    unsubscribeToEmailTypeVariables
  >(
    gql`
      mutation unsubscribeToEmailType($emailType: String!) {
        unsubscribeToEmailType(input: { emailType: $emailType }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetUser"] }
  );

  if (error) {
    console.error("Apollo error while updating the user's email preferences:", error);
  }

  return (emailType: EmailSubscription) => unsubscribeToEmailType({ variables: { emailType } });
}

export function useAcceptTOS() {
  const [acceptTOS] = useMutation<AcceptTOS, AcceptTOSVariables>(
    gql`
      mutation AcceptTOS($version: Int!) {
        acceptTermsOfService(input: { version: $version }) {
          success
        }
      }
    `,
    {
      refetchQueries: ["GetUser"],
    }
  );

  return acceptTOS;
}

export function isPrivilegedUser(recording: Recording, userId: string, workspaces: Workspace[]) {
  const sameTeam =
    recording.workspace?.id && workspaces.find(w => w.id === recording.workspace?.id);
  const isOwner = userId == recording.user?.id;
  const isPrivilegedUser = isOwner || sameTeam;

  return isPrivilegedUser;
}

export function useGetUserPermissions(recording: Recording) {
  const { userId, loading: userIdLoading } = useGetUserId();
  const { workspaces, loading: workspacesLoading } = useGetNonPendingWorkspaces();

  if (userIdLoading || workspacesLoading) {
    return {
      loading: true,
      permissions: {
        move: false,
        moveToLibrary: false,
        privacy: false,
        rename: false,
        delete: false,
      },
    };
  }

  const isOwner = userId == recording.user?.id;
  const isPrivileged = isPrivilegedUser(recording, userId, workspaces);

  return {
    loading: false,
    permissions: {
      move: isPrivileged,
      moveToLibrary: isOwner,
      privacy: isPrivileged,
      rename: isPrivileged,
      delete: isPrivileged,
    },
  };
}
