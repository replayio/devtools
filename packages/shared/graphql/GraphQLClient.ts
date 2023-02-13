export interface GraphQLClientInterface {
  send<T>(body: Object, accessToken: string | null): Promise<T>;
}

// Longer term we probably want to consider using Relay for this;
// For now let's see how far we can get just using the Fetch API.
export class GraphQLClient implements GraphQLClientInterface {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async send<T>(body: Object, accessToken: string | null): Promise<T> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    return json.data as T;
  }
}
