import { SourceId, TimeStampedPointRange } from "@replayio/protocol";
import {
  PointRange,
  ContentType as ProtocolContentType,
  newSource as ProtocolSource,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import { Cache, createCache, createSingleEntryCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";
import { toPointRange } from "shared/utils/time";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

export type IndexedSource = ProtocolSource & {
  contentHashIndex: number;
  doesContentHashChange: boolean;
};

export type StreamSubscriber = () => void;
export type UnsubscribeFromStream = () => void;

export type StreamingSourceContents = {
  codeUnitCount: number | null;
  complete: boolean;
  contents: string | null;
  contentType: ProtocolContentType | null;
  lineCount: number | null;
  resolver: Promise<StreamingSourceContents>;
  sourceId: ProtocolSourceId;
  subscribe(subscriber: StreamSubscriber): UnsubscribeFromStream;
};

export const sourcesCache: Cache<[client: ReplayClientInterface], ProtocolSource[]> =
  createSingleEntryCache({
    debugLabel: "Sources",
    load: async ([client]) => {
      const protocolSources = await client.findSources();

      const urlToFirstSource: Map<SourceId, ProtocolSource> = new Map();
      const urlsThatChange: Set<SourceId> = new Set();

      protocolSources.forEach(source => {
        const { contentHash, kind, sourceId, url } = source;

        if (url) {
          if (urlToFirstSource.has(url)) {
            const firstSource = urlToFirstSource.get(url)!;
            const { contentHash: prevContentHash, kind: prevKind } = firstSource;
            if (kind === prevKind && contentHash !== prevContentHash) {
              urlsThatChange.add(url);
            }
          } else {
            urlToFirstSource.set(url, source);
          }
        }
      });

      const urlToIndex: Map<string, number> = new Map();

      return protocolSources.map(source => {
        const { url } = source;

        let contentHashIndex = 0;
        let doesContentHashChange = false;
        if (url) {
          doesContentHashChange = urlsThatChange.has(url);

          const index = urlToIndex.get(url) || 0;
          contentHashIndex = index;
          urlToIndex.set(url, index + 1);
        }

        return {
          ...source,
          contentHashIndex,
          doesContentHashChange,
        };
      });
    },
  });

export const sourcesByUrlCache: Cache<
  [client: ReplayClientInterface],
  Map<string, ProtocolSource[]>
> = createSingleEntryCache({
  debugLabel: "SourcesByUrl",
  load: async ([client]) => {
    const sources = await sourcesCache.readAsync(client);

    const sourcesByUrl = new Map<string, ProtocolSource[]>();

    for (let source of sources) {
      if (!source.url) {
        continue;
      }

      if (!sourcesByUrl.has(source.url)) {
        sourcesByUrl.set(source.url, []);
      }
      sourcesByUrl.get(source.url)!.push(source);
    }

    return sourcesByUrl;
  },
});

export const streamingSourceContentsCache: Cache<
  [client: ReplayClientInterface, sourceId: SourceId],
  StreamingSourceContents
> = createCache({
  debugLabel: "StreamingSourceContents",
  getKey: ([client, sourceId]) => sourceId,
  load: ([client, sourceId]) => {
    try {
      let notifyResolver: (streamingSourceContents: StreamingSourceContents) => void;
      const resolver = new Promise<StreamingSourceContents>(resolve => {
        notifyResolver = resolve;
      });

      const subscribers: Set<StreamSubscriber> = new Set();
      const streamingSourceContents: StreamingSourceContents = {
        codeUnitCount: null,
        complete: false,
        contents: null,
        contentType: null,
        lineCount: null,
        resolver,
        sourceId,
        subscribe(subscriber: StreamSubscriber) {
          subscribers.add(subscriber);
          return () => {
            subscribers.delete(subscriber);
          };
        },
      };

      const notifySubscribers = () => {
        subscribers.forEach(subscriber => subscriber());
      };

      // Fire and forget; data streams in.
      client
        .streamSourceContents(
          sourceId,
          ({ codeUnitCount, contentType, lineCount }) => {
            streamingSourceContents.codeUnitCount = codeUnitCount;
            streamingSourceContents.contentType = contentType;
            streamingSourceContents.lineCount = lineCount;
            notifySubscribers();
          },
          ({ chunk }) => {
            if (streamingSourceContents.contents === null) {
              streamingSourceContents.contents = chunk;
            } else {
              streamingSourceContents.contents += chunk;
            }

            const isComplete =
              streamingSourceContents.contents.length === streamingSourceContents.codeUnitCount;
            if (isComplete) {
              streamingSourceContents.complete = true;
            }

            notifySubscribers();
          }
        )
        .then(() => {
          subscribers.clear();

          notifyResolver(streamingSourceContents);
        });

      return streamingSourceContents;
    } catch (error) {
      throw error;
    }
  },
});

export async function getSourceAsync(
  client: ReplayClientInterface,
  sourceId: SourceId
): Promise<ProtocolSource | null> {
  const sources = await sourcesCache.readAsync(client);
  return sources.find(source => source.sourceId === sourceId) ?? null;
}

// TODO Remove this in favor of useStreamingValue()
// once streamingSourceContentsCache has been migrated to "suspense"
export function getSourceContentsSuspense(replayClient: ReplayClientInterface, sourceId: SourceId) {
  const streaming = streamingSourceContentsCache.read(replayClient, sourceId);
  if (streaming.complete) {
    return streaming.contents;
  } else {
    throw streaming.resolver;
  }
}

export function getSourceIfCached(sourceId: SourceId): ProtocolSource | null {
  const sources = sourcesCache.getValueIfCached(null as any);
  if (sources) {
    return sources.find(source => source.sourceId === sourceId) ?? null;
  }
  return null;
}

export function getSourceSuspends(
  client: ReplayClientInterface,
  sourceId: SourceId
): ProtocolSource | null {
  const sources = sourcesCache.read(client);
  return sources.find(source => source.sourceId === sourceId) ?? null;
}

export function isIndexedSource(source: ProtocolSource): source is IndexedSource {
  return source.hasOwnProperty("contentHashIndex");
}

export function shouldSourceBeDisplayed(source: ProtocolSource): boolean {
  return source.kind !== "inlineScript";
}
