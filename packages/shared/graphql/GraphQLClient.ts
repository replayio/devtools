import { DocumentNode } from "graphql";

type Data = {
  operationName: string;
  query: string | DocumentNode;
  variables: {
    [key: string]: any;
  };
};

// By default, we use real GraphQL backend APIs.
// We can leverage this when writing tests (or UI demos) by injecting a stub client.
export let graphqlUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.replay.io/v1/graphql";
let testScope: string | undefined;
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.searchParams.has("graphql")) {
    graphqlUrl = url.searchParams.get("graphql") as string;
  }
  testScope = url.searchParams.get("testScope") ?? undefined;
}

export interface GraphQLClientInterface {
  send<T>(data: Data, accessToken: string | null): Promise<T>;
}

// Longer term we probably want to consider using Relay for this;
// For now let's see how far we can get just using the Fetch API.
export class GraphQLClient implements GraphQLClientInterface {
  private url: string;
  private testScope: string | undefined;

  constructor(url: string, testScope?: string) {
    this.url = url;
    this.testScope = testScope;
  }

  async send<T>(data: Data, accessToken: string | null): Promise<T> {
    if (typeof data.query !== "string") {
      data.query = data.query.loc?.source.body ?? "";
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    if (testScope) {
      headers["replay-test-scope"] = testScope;
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const json: any = await response.json();

    return json.data as T;
  }
}

export const graphQLClient = new GraphQLClient(graphqlUrl, testScope);
