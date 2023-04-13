import { Location, SearchSourceContentsMatch, SourceId } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { insert } from "replay-next/src/utils/array";
import { isBowerComponent, isModuleFromCdn, isNodeModule } from "replay-next/src/utils/source";
import { ReplayClientInterface } from "shared/client/types";

import { sourcesCache } from "./SourcesCache";

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

export type StreamingSourceSearchResults = {
  complete: boolean;
  didOverflow: boolean;
  fetchedCount: number;
  orderedResults: SourceSearchResult[];
  subscribe(subscriber: Subscriber): UnsubscribeFunction;
};

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

export const searchCache: Cache<
  [replayClient: ReplayClientInterface, query: string, includeNodeModules: boolean, limit?: number],
  StreamingSourceSearchResults
> = createCache({
  config: { immutable: true },
  debugLabel: "Search",
  getKey: ([replayClient, query, includeNodeModules, limit = MAX_SEARCH_RESULTS_TO_DISPLAY]) =>
    `${includeNodeModules}:${limit || "-"}:${query}`,
  load: async ([
    replayClient,
    query,
    includeNodeModules,
    limit = MAX_SEARCH_RESULTS_TO_DISPLAY,
  ]) => {
    const subscribers: Set<Subscriber> = new Set();

    const orderedResults: SourceSearchResult[] = [];

    const result: StreamingSourceSearchResults = {
      complete: false,
      didOverflow: false,
      fetchedCount: 0,
      orderedResults,
      subscribe: (subscriber: Subscriber) => {
        subscribers.add(subscriber);
        return () => {
          subscribers.delete(subscriber);
        };
      },
    };

    if (sourceIdsWithNodeModules === null) {
      await initializeSourceIds(replayClient);
    }

    const sourceIds = includeNodeModules ? sourceIdsWithNodeModules! : sourceIdsWithoutNodeModules!;

    const notifySubscribers = () => {
      subscribers.forEach(subscriber => subscriber());
    };

    let currentResultLocation: SourceSearchResultLocation | null = null;

    replayClient
      .searchSources(
        { limit, query, sourceIds },
        (matches: SearchSourceContentsMatch[], didOverflow: boolean) => {
          result.didOverflow ||= didOverflow;
          result.fetchedCount += matches.length;

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

          notifySubscribers();
        }
      )
      .then(() => {
        result.complete = true;

        notifySubscribers();
      });

    return result;
  },
});

async function initializeSourceIds(client: ReplayClientInterface) {
  sourceIdsWithNodeModules = [];
  sourceIdsWithoutNodeModules = [];

  const sources = await sourcesCache.readAsync(client);

  // Insert sources in order so that original sources are first.
  const compareSources = (a: SourceId, b: SourceId) => {
    const aIsOriginal = client.isOriginalSource(a);
    const bIsOriginal = client.isOriginalSource(b);
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
    if (source.kind === "prettyPrinted" && source.generatedSourceIds?.length) {
      minifiedSources.add(source.generatedSourceIds[0]);
    }
  });

  sources.forEach(source => {
    const sourceId = source.sourceId;

    if (minifiedSources.has(sourceId)) {
      return;
    }

    const correspondingSourceId = client.getCorrespondingSourceIds(source.sourceId)[0];
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
