import { GraphQLClientInterface } from "./GraphQLClient";
import { Nag, UserInfo } from "./types";

// TODO Pass this client via Context
let GRAPHQL_URL = "https://api.replay.io/v1/graphql";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("graphql")) {
    GRAPHQL_URL = url.searchParams.get("graphql") as string;
  }
}

const GetUserQuery = `
query GetUser {
    viewer {
      user {
        name
        picture
        id
        __typename
      }
      motd
      features {
        library
        __typename
      }
      acceptedTOSVersion
      email
      internal
      nags
      unsubscribedEmailTypes
      __typename
    }
  }
`;

export async function getCurrentUserInfo(accessToken: string | null): Promise<UserInfo | null> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      ...(accessToken && {
        Authorization: `Bearer ${accessToken}`,
      }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operationName: "GetUser",
      query: GetUserQuery,
      variables: {},
    }),
  });
  const json = await response.json();

  // TODO GraphQL types
  const viewer = json.data?.viewer;
  if (!viewer) {
    return null;
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

const DismissNagMutation = `
  mutation DismissNag($nag: String!) {
    dismissNag(input: { nag: $nag }) {
      success
    }
  }
`;

export async function dismissNag(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  nag: Nag
) {
  await graphQLClient.send(
    {
      operationName: "DismissNag",
      query: DismissNagMutation,
      variables: { nag },
    },
    accessToken
  );
}
