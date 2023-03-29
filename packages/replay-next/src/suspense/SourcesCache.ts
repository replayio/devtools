import {
  ContentType as ProtocolContentType,
  newSource as ProtocolSource,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import {
  Cache,
  StreamingCache,
  StreamingValue,
  createSingleEntryCache,
  createStreamingCache,
} from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

export type IndexedSource = ProtocolSource & {
  contentHashIndex: number;
  doesContentHashChange: boolean;
};

export const sourcesCache: Cache<[client: ReplayClientInterface], ProtocolSource[]> =
  createSingleEntryCache({
    debugLabel: "Sources",
    load: async ([client]) => {
      const protocolSources = await client.findSources();

      const urlToFirstSource: Map<ProtocolSourceId, ProtocolSource> = new Map();
      const urlsThatChange: Set<ProtocolSourceId> = new Set();

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

type StreamingSourceContentsParams = [client: ReplayClientInterface, sourceId: ProtocolSourceId];
type StreamingSourceContentsData = {
  codeUnitCount: number;
  contentType: ProtocolContentType;
  lineCount: number;
};

export type StreamingSourceContentsCache = StreamingCache<
  StreamingSourceContentsParams,
  string,
  StreamingSourceContentsData
>;

export type StreamingSourceContentsValue = StreamingValue<string, StreamingSourceContentsData>;

export const streamingSourceContentsCache = createStreamingCache<
  StreamingSourceContentsParams,
  string,
  StreamingSourceContentsData
>({
  debugLabel: "StreamingSourceContents",
  getKey: (client, sourceId) => sourceId,
  load: async ({ update, reject, resolve }, client, sourceId) => {
    try {
      let data: StreamingSourceContentsData | null = null;
      let contents: string = "";

      // Fire and forget; data streams in.
      await client.streamSourceContents(
        sourceId,
        ({ codeUnitCount, contentType, lineCount }) => {
          data = { codeUnitCount, contentType, lineCount };
          update("", 0, data);
        },
        ({ chunk }) => {
          contents += chunk;

          update(contents, contents.length / data!.codeUnitCount, data!);
        }
      );

      resolve();
    } catch (error) {
      reject(error);
    }
  },
});

export async function getSourceAsync(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): Promise<ProtocolSource | null> {
  const sources = await sourcesCache.readAsync(client);
  return sources.find(source => source.sourceId === sourceId) ?? null;
}

export function getSourceIfCached(sourceId: ProtocolSourceId): ProtocolSource | null {
  const sources = sourcesCache.getValueIfCached(null as any);
  if (sources) {
    return sources.find(source => source.sourceId === sourceId) ?? null;
  }
  return null;
}

export function getSourceSuspends(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
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
