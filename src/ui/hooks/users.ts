import { gql, useMutation, useQuery } from "@apollo/client";
import { mutate, query } from "ui/utils/apolloClient";
import { GET_USER_INFO, GET_USER_ID, DISMISS_NAG } from "ui/graphql/users";
import { sendTelemetryEvent } from "ui/utils/telemetry";
import { useGetRecording } from "./recordings";
import { getRecordingId, isTest } from "ui/utils/environment";

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
  const { recording } = useGetRecording(getRecordingId());
  const { userId } = useGetUserId();

  return userId && userId === recording?.userId;
}

export type UserInfo = {
  motd: string | null;
  acceptedTOSVersion: number | null;
  email: string;
  id: string;
  internal: boolean;
  nags: Nag[];
  unsubscribedEmailTypes: string[];
};

export enum Nag {
  FIRST_REPLAY = "first_replay",
  FIRST_REPLAY_2 = "first_replay_2",
  FIRST_BREAKPOINT_EDIT = "first_breakpoint_edit",
  FIRST_BREAKPOINT_ADD = "first_breakpoint_add",
  FIRST_BREAKPOINT_REMOVED = "first_breakpoint_removed",
  FIRST_CONSOLE_NAVIGATE = "first_console_navigate",
  FIRST_GUTTER_CLICK = "first_gutter_click",
  DOWNLOAD_REPLAY = "download_replay",
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
    motd: viewer.motd,
    acceptedTOSVersion: viewer.acceptedTOSVersion,
    email: viewer.email,
    id: viewer.user.id,
    internal: viewer.internal,
    nags: viewer.nags,
    unsubscribedEmailTypes: viewer.unsubscribedEmailTypes,
  };
}

export function useGetUserInfo() {
  const { data, loading, error } = useQuery(GET_USER_INFO);

  if (error) {
    console.error("Apollo error while fetching user:", error);
  }

  const id: string = data?.viewer?.user.id;
  const name: string = data?.viewer?.user.name;
  const picture: string = data?.viewer?.user.picture;
  const email: string = data?.viewer?.email;
  const internal: boolean = data?.viewer?.internal;
  const nags: Nag[] = data?.viewer?.nags;
  const unsubscribedEmailTypes: EmailSubscription[] = data?.viewer?.unsubscribedEmailTypes;
  const acceptedTOSVersion = data?.viewer?.acceptedTOSVersion;
  const motd: string = data?.viewer?.motd;

  return {
    loading,
    id,
    email,
    internal,
    nags,
    name,
    picture,
    acceptedTOSVersion,
    unsubscribedEmailTypes,
    motd,
  };
}

export function useDismissNag() {
  const [dismissNag, { error }] = useMutation(DISMISS_NAG, {
    refetchQueries: ["GetUser"],
  });
  const { nags } = useGetUserInfo();

  if (error) {
    console.error("Apollo error while updating the user's nags:", error);
  }

  return (nag: Nag) => {
    if (!nags || nags.includes(nag)) {
      return;
    }

    dismissNag({
      variables: { nag },
    });
  };
}

export function useSubscribeToEmailType() {
  const [subscribeToEmailType, { error }] = useMutation(
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
  const [unsubscribeToEmailType, { error }] = useMutation(
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
  const [acceptTOS] = useMutation(
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
