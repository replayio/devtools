import { v4 as uuid } from "uuid";

// Generate a client ID so that we can easily filter backend requests down to a specific client
// browser tab. It might seem like we should just be attaching the session ID here, but devtools
// makes requests before the session is established, so we use an arbitrary ID instead.
const GRAPHQL_CLIENT_ID = uuid();
// The header value of this header key will be logged on the backend during GraphQL requests.
const GRAPHQL_CLIENT_ID_HEADER_KEY = "Replay-Client-Id";

export function graphqlClientIdHeader() {
  return {
    [GRAPHQL_CLIENT_ID_HEADER_KEY]: GRAPHQL_CLIENT_ID,
  };
}
