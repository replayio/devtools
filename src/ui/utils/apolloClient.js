import { ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "apollo-link-http";
import { isDeployPreview } from "./environment";

export const createApolloClient = async auth0Client => {
  // NOTE: we do not support auth0 for preview builds
  if (!isDeployPreview() && auth0Client.isLoading) {
    return;
  }

  const options = !auth0Client.isAuthenticated
    ? {
        cache: new InMemoryCache(),
        uri: "https://graphql.replay.io/v1/graphql",
      }
    : {
        cache: new InMemoryCache(),
        link: await createHttpLink(auth0Client),
      };

  return new ApolloClient(options);
};

async function createHttpLink(auth0Client) {
  let hasuraToken = await getToken(auth0Client);

  return new HttpLink({
    uri: "https://graphql.replay.io/v1/graphql",
    headers: {
      Authorization: `Bearer ${hasuraToken}`,
    },
    fetch,
  });
}

async function getToken(auth0Client) {
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
