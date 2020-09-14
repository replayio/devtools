import { gql, ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "apollo-link-http";
import { useAuth0 } from "@auth0/auth0-react";

const auth = useAuth0();
const hasuraToken = auth.getAccessTokenSilently({
  audience: "hasura-api",
});

const createHttpLink = headers => {
  return new HttpLink({
    uri: "http://graphql.replay.io/v1/graphql",
    headers: {
      ...headers,
      Authorization: `Bearer ${hasuraToken}`,
    },
    fetch,
  });
};

export const createApolloClient = () => {
  const link = createHttpLink({});

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  client
    .query({
      query: gql`
        query MyRecordingsQuery {
          recordings(order_by: { date: asc }) {
            title
            id
            recording_id
            user {
              auth_id
            }
            url
          }
        }
      `,
    })
    .then(result => console.log(result));
  return client;
};
