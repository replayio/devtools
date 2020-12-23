import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  ApolloClientOptions,
} from "@apollo/client";
import { HttpLink } from "apollo-link-http";
import { isDeployPreview } from "./environment";
import { DocumentNode } from "graphql";
import { assert } from "protocol/utils";
import { Auth0ContextInterface } from "@auth0/auth0-react";

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

export function query({ variables = {}, query }: { variables: any; query: DocumentNode }) {
  assert(apolloClient);
  return apolloClient.query({ variables, query });
}

export function mutate({ variables = {}, mutation }: { variables: any; mutation: DocumentNode }) {
  assert(apolloClient);
  return apolloClient.mutate({ variables, mutation });
}

export const createApolloClient = async (auth0Client: Auth0ContextInterface) => {
  // NOTE: we do not support auth0 for preview builds
  if (!isDeployPreview() && auth0Client.isLoading) {
    return;
  }

  const options: any = !auth0Client.isAuthenticated
    ? {
        cache: new InMemoryCache(),
        uri: "https://graphql.replay.io/v1/graphql",
      }
    : {
        cache: new InMemoryCache(),
        link: await createHttpLink(auth0Client),
      };

  apolloClient = new ApolloClient(options);
  return apolloClient;
};

async function createHttpLink(auth0Client: Auth0ContextInterface) {
  let hasuraToken = await getToken(auth0Client);

  return new HttpLink({
    uri: "https://graphql.replay.io/v1/graphql",
    headers: {
      Authorization: `Bearer ${hasuraToken}`,
    },
    fetch,
  });
}

export async function getToken(auth0Client: Auth0ContextInterface) {
  try {
    return await auth0Client.getAccessTokenSilently({
      audience: "hasura-api",
    });
  } catch (e) {
    if (e.error !== "login_required" && e.error !== "consent_required") {
      throw e;
    }

    try {
      return await auth0Client.getAccessTokenWithPopup({
        audience: "hasura-api",
      });
    } catch (e) {
      throw e;
    }
  }
}
