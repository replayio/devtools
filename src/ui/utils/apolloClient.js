import { gql, ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "apollo-link-http";

export const createApolloClient = async auth0Client => {
  if (auth0Client.isLoading === true) {
    return;
  }

  let options = { cache: new InMemoryCache() };

  if (!auth0Client.isAuthenticated) {
    options = { ...options, uri: "https://graphql.replay.io/v1/graphql" };
  } else {
    console.log("created apolloclient with token");
    const link = await createHttpLink({}, auth0Client);
    options = { ...options, link };
  }

  return new ApolloClient(options);
};

async function createHttpLink(headers, auth0Client) {
  let hasuraToken = await getToken(auth0Client);

  return new HttpLink({
    uri: "https://graphql.replay.io/v1/graphql",
    headers: {
      ...headers,
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
