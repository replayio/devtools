import { gql, ApolloClient, InMemoryCache } from "@apollo/client";
import { HttpLink } from "apollo-link-http";

const createHttpLink = headers => {
  const httpLink = new HttpLink({
    uri: "http://graphql.replay.io/v1/graphql",
    headers: {
      ...headers,
      //   "x-hasura-admin-secret": "supersecret",
    }, // auth token is fetched on the server side
    fetch,
  });
  return httpLink;
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
        query MyRecordingsQuery($user_id: String) {
          recordings(where: { user: { auth_id: { _eq: $user_id } } }, order_by: { date: asc }) {
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
      options: {
        user_id: "google-oauth2|104244849821918151681",
      },
    })
    .then(result => console.log(result));
  return client;
};
