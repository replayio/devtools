import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { newSource, ProtocolClient, Location, PointDescription } from "@replayio/protocol";
import { client, initSocket } from "protocol/socket";
import { replayClient } from "../client/ReplayClient";

interface SourceGroups {
  src: newSource[];
  node_modules: newSource[];
  other: newSource[];
}

const reIsJsSourceFile = /(js|ts)x?$/;

export const api = createApi({
  baseQuery: fakeBaseQuery(),
  endpoints: build => ({
    getSources: build.query<SourceGroups, void>({
      queryFn: async () => {
        const sources: newSource[] = [];

        // Fetch the sources
        client.Debugger.addNewSourceListener(source => sources.push(source));
        await client.Debugger.findSources({}, replayClient.getSessionIdThrows());

        const sourceGroups: SourceGroups = {
          src: [],
          node_modules: [],
          other: [],
        };

        sources.forEach(entry => {
          if (!entry.url || !reIsJsSourceFile.test(entry.url)) {
            sourceGroups.other.push(entry);
            return;
          }

          const url = new URL(entry.url);
          if (url.pathname.startsWith("/src")) {
            sourceGroups.src.push(entry);
          } else if (url.pathname.startsWith("/node_modules")) {
            sourceGroups.node_modules.push(entry);
          } else {
            sourceGroups.other.push(entry);
          }
        });

        return { data: sourceGroups };
      },
    }),
  }),
});

export const { useGetSourcesQuery } = api;
