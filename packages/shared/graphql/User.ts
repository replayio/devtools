import { GetUser } from "./generated/GetUser";
import { GraphQLClientInterface, graphQLClient } from "./GraphQLClient";
import { EmailSubscription, Nag, UserInfo } from "./types";

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
  const data = await graphQLClient.send<GetUser>(
    {
      operationName: "GetUser",
      query: GetUserQuery,
      variables: {},
    },
    accessToken
  );

  // TODO GraphQL types
  const viewer = data?.viewer;
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
    nags: viewer.nags as Nag[],
    unsubscribedEmailTypes: viewer.unsubscribedEmailTypes as EmailSubscription[],
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
