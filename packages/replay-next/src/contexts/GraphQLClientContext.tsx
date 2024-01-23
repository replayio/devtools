import { createContext } from "react";

import { GraphQLClientInterface, graphQLClient } from "shared/graphql/GraphQLClient";

export type GraphQLClientContextType = GraphQLClientInterface;

export const GraphQLClientContext = createContext<GraphQLClientContextType>(graphQLClient);
