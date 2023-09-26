import { Location, SearchSourceContentsMatch, SourceId } from "@replayio/protocol";
import { StreamingCacheLoadOptions, StreamingValue, createStreamingCache } from "suspense";

import { insert } from "replay-next/src/utils/array";
import {
  isBowerComponent,
  isModuleFromCdn,
  isNodeModule,
  isSourceMappedSource,
} from "replay-next/src/utils/source";
import { ReplayClientInterface } from "shared/client/types";

import { getCorrespondingSourceIds } from "../utils/sources";
import { sourcesByIdCache } from "./SourcesCache";

// TODO Create a generic cache variant that
// (1) supports streaming data and
// (2) auto-throttles updates to avoid overloading the render queue.

export type Subscriber = () => void;
export type UnsubscribeFunction = () => void;

export type SourceSearchResultLocation = {
  location: Location;
  matchCount: number;
  type: "location";
};
export type SourceSearchResultMatch = { match: SearchSourceContentsMatch; type: "match" };
export type SourceSearchResult = SourceSearchResultLocation | SourceSearchResultMatch;

export type StreamingSourceMetadata = {
  didOverflow: boolean;
  fetchedCount: number;
};

export type StreamingSearchValue = StreamingValue<SourceSearchResult[], StreamingSourceMetadata>;

const MAX_SEARCH_RESULTS_TO_DISPLAY = 1_000;

let sourceIdsWithNodeModules: SourceId[] | null = null;
let sourceIdsWithoutNodeModules: SourceId[] | null = null;

export function isSourceSearchResultLocation(
  result: SourceSearchResult
): result is SourceSearchResultLocation {
  return result.type === "location";
}

export function isSourceSearchResultMatch(
  result: SourceSearchResult
): result is SourceSearchResultMatch {
  return result.type === "match";
}

export const searchCache = createStreamingCache<
  [replayClient: ReplayClientInterface, query: string, includeNodeModules: boolean, limit?: number],
  SourceSearchResult[],
  StreamingSourceMetadata
>({
  debugLabel: "NetworkRequestsCache",
  getKey: (replayClient, query, includeNodeModules, limit) =>
    `${limit}-${includeNodeModules}-${query.trim()}`,
  load: async (
    options: StreamingCacheLoadOptions<SourceSearchResult[], StreamingSourceMetadata>,
    replayClient,
    query,
    includeNodeModules,
    limit = MAX_SEARCH_RESULTS_TO_DISPLAY
  ) => {
    const { reject, update, resolve } = options;

    query = query.trim();

    const metadata: StreamingSourceMetadata = {
      didOverflow: false,
      fetchedCount: 0,
    };
    const orderedResults: SourceSearchResult[] = [];

    if (query === "") {
      update([], undefined, metadata);
      resolve();
      return;
    }

    const sourceIds = await getSourceIds(replayClient, includeNodeModules);

    let currentResultLocation: SourceSearchResultLocation | null = null;

    try {
      await replayClient.searchSources(
        { limit, query, sourceIds },
        (matches: SearchSourceContentsMatch[], didOverflow: boolean) => {
          metadata.didOverflow ||= didOverflow;
          metadata.fetchedCount += matches.length;

          for (let index = 0; index < matches.length; index++) {
            const match = matches[index];

            if (
              currentResultLocation === null ||
              currentResultLocation.location.sourceId !== match.location.sourceId
            ) {
              currentResultLocation = { location: match.location, matchCount: 0, type: "location" };

              orderedResults.push(currentResultLocation);
            }

            currentResultLocation.matchCount++;

            orderedResults.push({ match, type: "match" });
          }

          update(orderedResults, undefined, metadata);
        }
      );

      resolve();
    } catch (error) {
      reject(error);
    }
  },
});

async function getSourceIds(client: ReplayClientInterface, includeNodeModules: boolean) {
  if (sourceIdsWithNodeModules == null || sourceIdsWithoutNodeModules == null) {
    sourceIdsWithNodeModules = [];
    sourceIdsWithoutNodeModules = [];

    const sources = await sourcesByIdCache.readAsync(client);

    // Insert sources in order so that original sources are first.
    const compareSources = (a: SourceId, b: SourceId) => {
      const aIsOriginal = isSourceMappedSource(a, sources);
      const bIsOriginal = isSourceMappedSource(b, sources);
      if (aIsOriginal === bIsOriginal) {
        return 0;
      } else if (aIsOriginal) {
        return -1;
      } else {
        return 1;
      }
    };

    const minifiedSources = new Set<SourceId>();
    sources.forEach(source => {
      if (source.kind === "prettyPrinted" && source.generated.length) {
        minifiedSources.add(source.generated[0]);
      }
    });

    sources.forEach(source => {
      const sourceId = source.sourceId;

      if (minifiedSources.has(sourceId)) {
        return;
      }

      const correspondingSourceId = getCorrespondingSourceIds(sources, source.sourceId)[0];
      if (correspondingSourceId !== sourceId) {
        return;
      }

      if (isBowerComponent(source)) {
        return;
      }

      if (!isNodeModule(source) && !isModuleFromCdn(source)) {
        insert(sourceIdsWithoutNodeModules!, sourceId, compareSources);
      }

      insert(sourceIdsWithNodeModules!, sourceId, compareSources);
    });
  }

  return includeNodeModules ? sourceIdsWithNodeModules! : sourceIdsWithoutNodeModules!;
}
