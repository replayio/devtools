import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { newSource, ProtocolClient, Location, PointDescription } from "@replayio/protocol";
import { client, initSocket } from "protocol/socket";
import { replayClient } from "../client/ReplayClient";

export const api = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: build => ({
    getSources: build.query<newSource[], void>({
      queryFn: async () => {
        const sources: newSource[] = [];

        // Fetch the sources
        client.Debugger.addNewSourceListener(source => sources.push(source));
        await client.Debugger.findSources({}, replayClient.getSessionIdThrows());

        return { data: sources };
      },
    }),
  }),
});

export const { useGetSourcesQuery } = api;
