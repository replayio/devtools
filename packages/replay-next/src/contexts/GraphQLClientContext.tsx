import { createContext } from "react";

import { GraphQLClient, GraphQLClientInterface } from "../graphql/GraphQLClient";

export type GraphQLClientContextType = GraphQLClientInterface;

// By default, this context wires the app up to use real GraphQL backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
let graphqlUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.replay.io/v1/graphql";
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("graphql")) {
    graphqlUrl = url.searchParams.get("graphql") as string;
  }
}

export const GraphQLClientContext = createContext<GraphQLClientContextType>(
  new GraphQLClient(graphqlUrl)
);
