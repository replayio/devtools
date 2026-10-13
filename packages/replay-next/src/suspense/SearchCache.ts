import assert from "assert";
import { Location, SearchSourceContentsMatch, SourceId } from "@replayio/protocol";
import { Minimatch } from "minimatch";
import { StreamingCacheLoadOptions, StreamingValue, createStreamingCache } from "suspense";

import { insert } from "replay-next/src/utils/array";
import {
  isBowerComponent,
  isModuleFromCdn,
  isNodeModule,
  isSourceMappedSource,
} from "replay-next/src/utils/source";
import { ReplayClientInterface } from "shared/client/types";

import { Source } from "../suspense/SourcesCache";
import { getCorrespondingSourceIds } from "../utils/sources";
import { sourcesByIdCache } from "./SourcesCache";

// TODO Create a generic cache variant that
// (1) supports streaming data and
// (2) auto-throttles updates to avoid overloading the render queue.

export type Subscriber = () => void;
export type UnsubscribeFunction = () => void;

let idCounter = 0;

export type SourceSearchResultLocation = {
  id: number;
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

export function assertSourceSearchResultLocation(
  result: SourceSearchResult
): asserts result is SourceSearchResultLocation {
  assert(isSourceSearchResultLocation(result));
}

export function assertSourceSearchResultMatch(
  result: SourceSearchResult
): asserts result is SourceSearchResultMatch {
  assert(isSourceSearchResultLocation(result));
}

export const searchCache = createStreamingCache<
  [
    replayClient: ReplayClientInterface,
    query: string,
    excludeNodeModules: boolean,
    includedFiles: string,
    excludedFiles: string,
    activeSourceIds: string[] | null,
    useRegex: boolean,
    caseSensitive: boolean,
    wholeWord: boolean,
    limit?: number
  ],
  SourceSearchResult[],
  StreamingSourceMetadata
>({
  debugLabel: "NetworkRequestsCache",
  getKey: (replayClient, query, ...args) => `${args.join("-")}-${query.trim()}`,
  load: async (
    options: StreamingCacheLoadOptions<SourceSearchResult[], StreamingSourceMetadata>,
    replayClient,
    query,
    excludeNodeModules,
    includedFiles,
    excludedFiles,
    activeSourceIds,
    useRegex,
    caseSensitive,
    wholeWord,
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

    const includedFilesMatcher = new Minimatch(includedFiles, { matchBase: true });
    const excludedFilesMatcher = new Minimatch(excludedFiles, { matchBase: true });
    const sourceIds = await getSourceIds(replayClient, source => {
      if (!source.url) {
        return false;
      }

      if (activeSourceIds && !activeSourceIds.includes(source.sourceId)) {
        return false;
      }

      if (excludeNodeModules && (isModuleFromCdn(source) || isNodeModule(source))) {
        return false;
      }

      if (excludedFiles && excludedFilesMatcher.match(source.url)) {
        return false;
      }

      if (includedFiles && !includedFilesMatcher.match(source.url)) {
        return false;
      }

      return true;
    });

    let currentResultLocation: SourceSearchResultLocation | null = null;

    try {
      await replayClient.searchSources(
        { limit, query, sourceIds, useRegex, wholeWord, caseSensitive },
        (matches: SearchSourceContentsMatch[], didOverflow: boolean) => {
          metadata.didOverflow ||= didOverflow;
          metadata.fetchedCount += matches.length;

          for (let index = 0; index < matches.length; index++) {
            const match = matches[index];

            if (
              currentResultLocation === null ||
              currentResultLocation.location.sourceId !== match.location.sourceId
            ) {
              currentResultLocation = {
                id: ++idCounter,
                location: match.location,
                matchCount: 0,
                type: "location",
              };

              orderedResults.push(currentResultLocation);
            }

            currentResultLocation.matchCount++;

            orderedResults.push({ match, type: "match" });
          }

          // Clone results array to avoid breaking/bypassing external memoization
          update([...orderedResults], undefined, metadata);
        }
      );

      resolve();
    } catch (error) {
      reject(error);
    }
  },
});

async function getSourceIds(
  client: ReplayClientInterface,
  includeSource: (source: Source) => boolean
) {
  const filteredSources: SourceId[] = [];
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

    if (source.url && includeSource(source)) {
      insert(filteredSources, sourceId, compareSources);
    }
  });

  return filteredSources;
}
