import { DocumentNode } from "graphql";

type Data = {
  operationName: string;
  query: string | DocumentNode;
  variables: {
    [key: string]: any;
  };
};

export interface GraphQLClientInterface {
  send<T>(data: Data, accessToken: string | null): Promise<T>;
}

// Longer term we probably want to consider using Relay for this;
// For now let's see how far we can get just using the Fetch API.
export class GraphQLClient implements GraphQLClientInterface {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async send<T>(data: Data, accessToken: string | null): Promise<T> {
    if (typeof data.query !== "string") {
      data.query = data.query.loc?.source.body ?? "";
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const json: any = await response.json();

    return json.data as T;
  }
}
