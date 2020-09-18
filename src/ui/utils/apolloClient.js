import { gql, ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "apollo-link-http";

export const createApolloClient = async auth0Client => {
  if (auth0Client.isLoading === true || !auth0Client.isAuthenticated) {
    return;
  }
  const createHttpLink = async headers => {
    let hasuraToken = await getToken(auth0Client);

    return new HttpLink({
      uri: "https://graphql.replay.io/v1/graphql",
      headers: {
        ...headers,
        Authorization: `Bearer ${hasuraToken}`,
      },
      fetch,
    });
  };

  const link = await createHttpLink({});

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  return client;
};

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
