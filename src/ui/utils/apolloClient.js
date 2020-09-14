import { gql, ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "apollo-link-http";

export const createApolloClient = async auth0Client => {
  if (auth0Client.isLoading === true) {
    return;
  }
  const createHttpLink = async headers => {
    const hasuraToken = await auth0Client.getAccessTokenSilently({
      audience: "hasura-api",
    });

    return new HttpLink({
      uri: "http://graphql.replay.io/v1/graphql",
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

  client
    .query({
      query: gql`
        query MyRecordingsQuery {
          recordings {
            id
          }
        }
      `,
    })
    .then(result => console.log(result));
  return client;
};
