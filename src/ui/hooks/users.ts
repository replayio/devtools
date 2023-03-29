import { gql, useMutation, useQuery } from "@apollo/client";

import { AcceptTOS, AcceptTOSVariables } from "shared/graphql/generated/AcceptTOS";
import { DismissNag, DismissNagVariables } from "shared/graphql/generated/DismissNag";
import { GetUser } from "shared/graphql/generated/GetUser";
import { GetUserId } from "shared/graphql/generated/GetUserId";
import {
  subscribeToEmailType,
  subscribeToEmailTypeVariables,
} from "shared/graphql/generated/subscribeToEmailType";
import {
  unsubscribeToEmailType,
  unsubscribeToEmailTypeVariables,
} from "shared/graphql/generated/unsubscribeToEmailType";
import { Recording, Workspace } from "shared/graphql/types";
import { DISMISS_NAG, GET_USER_ID, GET_USER_INFO } from "ui/graphql/users";
import { mutate, query } from "ui/utils/apolloClient";
import { getRecordingId } from "ui/utils/recording";
import { sendTelemetryEvent } from "ui/utils/telemetry";

import { useGetRecording } from "./recordings";
import { useGetNonPendingWorkspaces } from "./workspaces";

export async function getUserId() {
  const result = await query<GetUserId>({ query: GET_USER_ID });
  return result?.data?.viewer?.user?.id;
}

export async function dismissNag(nag: Nag) {
  await mutate<DismissNag, DismissNagVariables>({
    mutation: DISMISS_NAG,
    variables: { nag },
    refetchQueries: ["GetUser"],
  });
}

export function useGetUserId() {
  const { data, loading, error } = useQuery<GetUserId>(GET_USER_ID);
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
  name: string | null;
  picture: string | null;
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
  VIEW_DEVTOOLS = "view_devtools",
  FIRST_BREAKPOINT_EDIT = "first_breakpoint_edit",
  FIRST_BREAKPOINT_ADD = "first_breakpoint_add",
  FIRST_BREAKPOINT_SAVE = "first_breakpoint_save",
  FIRST_CONSOLE_NAVIGATE = "first_console_navigate",
  DOWNLOAD_REPLAY = "download_replay",
  DISMISS_TOUR = "dismiss_tour",
  ADD_COMMENT = "add_comment",
  ADD_COMMENT_TO_LINE = "add_comment_to_line",
  ADD_COMMENT_TO_NETWORK_REQUEST = "add_comment_to_network_request",
  ADD_COMMENT_TO_PRINT_STATEMENT = "add_comment_to_print_statement",
  JUMP_TO_CODE = "jump_to_code",
  ADD_UNICORN_BADGE = "add_unicorn_badge",
  RECORD_REPLAY = "record_replay",
  EXPLORE_SOURCES = "explore_sources",
  SEARCH_SOURCE_TEXT = "search_source_text",
  QUICK_OPEN_FILE = "quick_open_file",
  LAUNCH_COMMAND_PALETTE = "launch_command_palette",
  JUMP_TO_EVENT = "jump_to_event",
  INSPECT_ELEMENT = "inspect_element",
  INSPECT_COMPONENT = "inspect_component",
  USE_FOCUS_MODE = "use_focus_mode",
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
  const result = await query<GetUser>({ query: GET_USER_INFO });
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
    nags: viewer.nags as Nag[],
    unsubscribedEmailTypes: viewer.unsubscribedEmailTypes as EmailSubscription[],
    features: viewer.features || {},
  };
}

export function useGetUserInfo(): UserInfo & { loading: boolean } {
  const { data, loading, error } = useQuery<GetUser>(GET_USER_INFO);

  if (error) {
    console.error("Apollo error while fetching user:", error);
  }

  const id: string = data?.viewer?.user.id!;
  const picture: string = data?.viewer?.user.picture!;
  const name: string = data?.viewer?.user.name!;
  const email: string = data?.viewer?.email!;
  const internal: boolean = data?.viewer?.internal!;
  const nags: Nag[] = data?.viewer?.nags as Nag[];
  const unsubscribedEmailTypes: EmailSubscription[] = data?.viewer
    ?.unsubscribedEmailTypes as EmailSubscription[];
  const acceptedTOSVersion = data?.viewer?.acceptedTOSVersion ?? null;
  const motd: string = data?.viewer?.motd!;
  const features = data?.viewer?.features || {
    library: false,
  };

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
  const isPrivileged = userId ? isPrivilegedUser(recording, userId, workspaces) : false;

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
