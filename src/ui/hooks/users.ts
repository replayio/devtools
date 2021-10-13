import { gql, useMutation, useQuery } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { GET_USER_INFO, GET_USER_ID } from "ui/graphql/users";
import { sendTelemetryEvent } from "ui/utils/telemetry";

export async function getUserId() {
  const result = await query({
    query: GET_USER_ID,
    variables: {},
  });
  return result?.data?.viewer?.user?.id;
}

export function useGetUserId() {
  const { data, loading, error } = useQuery(GET_USER_ID);
  return { userId: data?.viewer?.user.id, loading, error };
}

export type UserInfo = {
  id: string;
  email: string;
  internal: boolean;
  loading: boolean;
  nags: Nag[];
  acceptedTOSVersion: number | null;
};

export enum Nag {
  FIRST_REPLAY = "first_replay",
  FIRST_REPLAY_2 = "first_replay_2",
  FIRST_BREAKPOINT_EDIT = "first_breakpoint_edit",
  FIRST_BREAKPOINT_ADD = "first_breakpoint_add",
}

export enum EmailPreference {
  MARKETING = "marketing",
  COLLABORATOR_REQUEST = "collaborator_request",
  REPLAY_COMMENT = "replay_comment",
  NEW_TEAM_INVITE = "new_team_invite",
}

export async function getUserInfo(): Promise<Omit<UserInfo, "loading"> | undefined> {
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
    id: viewer.user.id,
    email: viewer.email,
    internal: viewer.internal,
    nags: viewer.nags,
    acceptedTOSVersion: viewer.acceptedTOSVersion,
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
  const emailsOptedOut: EmailPreference[] = data?.viewer?.email_preferences;
  const acceptedTOSVersion = data?.viewer?.acceptedTOSVersion;

  return {
    loading,
    id,
    email,
    internal,
    nags,
    name,
    picture,
    acceptedTOSVersion,
    emailsOptedOut,
  };
}

export function useUpdateUserNags() {
  const [updateUserNags, { error }] = useMutation(
    gql`
      mutation UpdateUserNags($newNags: [String!]!) {
        updateUserNags(input: { nags: $newNags }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetUser"] }
  );

  if (error) {
    console.error("Apollo error while updating the user's nags:", error);
  }

  return updateUserNags;
}

// The preferences list is a blacklist of preferences that are disabled. This
// enables the preference by removing the preference from the list, if it exists.
export function useEnableEmailPreference() {
  const updateUserEmailPreferences = useUpdateUserEmailPreferences();

  return (preference: EmailPreference, emailsOptedOut: EmailPreference[]) => {
    const newPrefs = emailsOptedOut.filter(p => p !== preference);
    updateUserEmailPreferences(newPrefs);
  };
}

// The preferences list is a blacklist of preferences that are disabled. This
// disables the preference by adding the preference to the list, if it's not already there.
export function useDisableEmailPreference() {
  const updateUserEmailPreferences = useUpdateUserEmailPreferences();

  return (preference: EmailPreference, emailsOptedOut: EmailPreference[]) => {
    const newPrefs = emailsOptedOut.includes(preference)
      ? emailsOptedOut
      : [...emailsOptedOut, preference];
    updateUserEmailPreferences(newPrefs);
  };
}

export function useUpdateUserEmailPreferences() {
  const [useUpdateUserEmailPreferences, { error }] = useMutation(
    gql`
      mutation useUpdateUserEmailPreferences($newEmailPreferences: [String!]!) {
        useUpdateUserEmailPreferences(input: { emailPreferences: $newEmailPreferences }) {
          success
        }
      }
    `,
    { refetchQueries: ["GetUser"] }
  );

  if (error) {
    console.error("Apollo error while updating the user's email preferences:", error);
  }

  return (newPrefs: EmailPreference[]) =>
    useUpdateUserEmailPreferences({ variables: { emailPreferences: newPrefs } });
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
