import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  newSource,
  ProtocolClient,
  Location,
  PointDescription,
  HitCount,
} from "@replayio/protocol";
import { Dictionary } from "lodash";
import groupBy from "lodash/groupBy";

import { client, initSocket } from "protocol/socket";
import { replayClient } from "../client/ReplayClient";

interface SourceGroups {
  src: newSource[];
  node_modules: newSource[];
  other: newSource[];
}

const reIsJsSourceFile = /(js|ts)x?$/;

const CACHE_DATA_PERMANENTLY = 10 * 365 * 24 * 60 * 60;

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
      keepUnusedDataFor: CACHE_DATA_PERMANENTLY,
    }),
    getSourceText: build.query<string, string>({
      queryFn: async sourceId => {
        const demoSourceText = await client.Debugger.getSourceContents(
          {
            sourceId,
          },
          replayClient.getSessionIdThrows()
        );
        return { data: demoSourceText.contents };
      },
      keepUnusedDataFor: CACHE_DATA_PERMANENTLY,
    }),
    getSourceHitCounts: build.query<Dictionary<HitCount[]>, string>({
      queryFn: async sourceId => {
        const sessionId = replayClient.getSessionIdThrows();
        const { lineLocations } = await client.Debugger.getPossibleBreakpoints(
          {
            sourceId,
          },
          sessionId
        );

        const hitCounts = await client.Debugger.getHitCounts(
          {
            sourceId,
            locations: lineLocations,
            maxHits: 250,
          },
          sessionId
        );

        const hitsByLine = groupBy(hitCounts.hits, entry => entry.location.line);
        return { data: hitsByLine };
      },
      keepUnusedDataFor: CACHE_DATA_PERMANENTLY,
    }),
    getLineHitPoints: build.query<PointDescription[], Location>({
      queryFn: async location => {
        const sessionId = replayClient.getSessionIdThrows();

        const data = await new Promise<PointDescription[]>(async resolve => {
          const { analysisId } = await client.Analysis.createAnalysis(
            {
              mapper: "",
              effectful: false,
            },
            sessionId
          );

          client.Analysis.addLocation({ analysisId, location }, sessionId);
          client.Analysis.findAnalysisPoints({ analysisId }, sessionId);
          client.Analysis.addAnalysisPointsListener(({ points }) => {
            resolve(points);
            client.Analysis.releaseAnalysis({ analysisId }, sessionId);
          });
        });

        return { data };
      },
    }),
  }),
});

export const {
  useGetSourcesQuery,
  useGetSourceTextQuery,
  useGetSourceHitCountsQuery,
  useGetLineHitPointsQuery,
} = api;
