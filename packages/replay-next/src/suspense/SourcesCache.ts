import {
  ContentType as ProtocolContentType,
  Source as ProtocolSource,
  SourceId as ProtocolSourceId,
  SourceKind as ProtocolSourceKind,
  SourceId,
} from "@replayio/protocol";
import {
  Cache,
  StreamingCache,
  StreamingValue,
  createCache,
  createSingleEntryCache,
  createStreamingCache,
  useImperativeCacheValue,
} from "suspense";

import { ArrayMap, assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

export interface Source {
  //TODO [FE-1493] remove this duplicate ID once the Source migration is done
  id: ProtocolSourceId;
  sourceId: ProtocolSourceId;
  kind: ProtocolSourceKind;
  url?: string;
  contentId: string;
  contentIdIndex: number;
  // true if there is another source with the same url but a different contentId
  doesContentIdChange: boolean;
  isSourceMapped: boolean;
  correspondingSourceIds: ProtocolSourceId[];
  generated: ProtocolSourceId[];
  generatedFrom: ProtocolSourceId[];
  prettyPrinted?: ProtocolSourceId;
  prettyPrintedFrom?: ProtocolSourceId;
}

export const sourcesCache: Cache<[client: ReplayClientInterface], Source[]> =
  createSingleEntryCache({
    debugLabel: "Sources",
    load: async ([client]) => {
      const protocolSources = await client.findSources();
      return processSources(protocolSources);
    },
  });

// sources with the same key will be grouped as corresponding sources
const keyForSource = (source: ProtocolSource, sources: Map<ProtocolSourceId, ProtocolSource>) => {
  const { sourceId, kind, url, generatedSourceIds } = source;

  let contentHash = source.contentHash;
  if (kind === "prettyPrinted") {
    assert(
      generatedSourceIds?.length === 1,
      `pretty-printed source ${sourceId} should have exactly one generated source`
    );
    const minifiedSource = sources.get(generatedSourceIds[0]);
    assert(minifiedSource, `couldn't find minified source for ${sourceId}`);
    contentHash = minifiedSource.contentHash;
  }
  assert(contentHash, `couldn't determine contentHash for ${sourceId}`);

  return `${kind}:${url}:${contentHash}`;
};

function processSources(protocolSources: ProtocolSource[]): Source[] {
  const protocolSourcesById = new Map<ProtocolSourceId, ProtocolSource>(
    protocolSources.map(source => [source.sourceId, source])
  );
  const corresponding = new ArrayMap<string, ProtocolSourceId>();
  // the ProtocolSource objects link original to generated sources, here we collect the links in the other direction
  const original = new ArrayMap<ProtocolSourceId, ProtocolSourceId>();
  // same as above, but only for the links from pretty-printed to minified sources
  const prettyPrinted = new Map<ProtocolSourceId, ProtocolSourceId>();

  const urlToFirstSource: Map<ProtocolSourceId, ProtocolSource> = new Map();
  const urlsThatChange: Set<ProtocolSourceId> = new Set();

  protocolSources.forEach(source => {
    const { contentId, generatedSourceIds, kind, sourceId, url } = source;
    const key = keyForSource(source, protocolSourcesById);

    corresponding.add(key, sourceId);

    for (const generatedSourceId of generatedSourceIds || []) {
      original.add(generatedSourceId, sourceId);
    }

    if (kind === "prettyPrinted") {
      assert(
        generatedSourceIds?.length === 1,
        "a pretty-printed source should have exactly one generated source"
      );
      prettyPrinted.set(generatedSourceIds[0], sourceId);
    }

    if (url) {
      if (urlToFirstSource.has(url)) {
        const firstSource = urlToFirstSource.get(url)!;
        const { contentId: prevContentId, kind: prevKind } = firstSource;
        if (kind === prevKind && contentId !== prevContentId) {
          urlsThatChange.add(url);
        }
      } else {
        urlToFirstSource.set(url, source);
      }
    }
  });

  const urlToIndex: Map<string, number> = new Map();

  return protocolSources.map(source => {
    const { contentId, generatedSourceIds, kind, sourceId, url } = source;
    const key = keyForSource(source, protocolSourcesById);

    let contentIdIndex = 0;
    let doesContentIdChange = false;
    if (url) {
      doesContentIdChange = urlsThatChange.has(url);

      const index = urlToIndex.get(url) || 0;
      contentIdIndex = index;
      urlToIndex.set(url, index + 1);
    }

    const isSourceMapped =
      kind === "prettyPrinted"
        ? protocolSourcesById.get(generatedSourceIds![0])!.kind === "sourceMapped"
        : source.kind === "sourceMapped";

    return {
      id: sourceId,
      sourceId,
      kind,
      url,
      contentId,
      contentIdIndex,
      doesContentIdChange,
      isSourceMapped,
      correspondingSourceIds: corresponding.map.get(key)!,
      generated: generatedSourceIds ?? [],
      generatedFrom: original.map.get(sourceId) ?? [],
      prettyPrinted: prettyPrinted.get(sourceId),
      prettyPrintedFrom: source.kind === "prettyPrinted" ? generatedSourceIds![0] : undefined,
    };
  });
}

export const sourcesByUrlCache: Cache<
  [client: ReplayClientInterface],
  Map<string, Source[]>
> = createSingleEntryCache({
  debugLabel: "SourcesByUrl",
  load: async ([client]) => {
    const sources = await sourcesCache.readAsync(client);

    const sourcesByUrl = new Map<string, Source[]>();

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

export const sourcesByIdCache = createSingleEntryCache<
  [client: ReplayClientInterface],
  Map<SourceId, Source>
>({
  debugLabel: "SourcesById",
  load: async ([client]) => {
    const sources = await sourcesCache.readAsync(client);
    return new Map(sources.map(source => [source.sourceId, source]));
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
): Promise<Source | null> {
  const sources = await sourcesByIdCache.readAsync(client);
  return sources.get(sourceId) ?? null;
}

export function getSourceIfCached(sourceId: ProtocolSourceId): Source | null {
  const sources = sourcesByIdCache.getValueIfCached(null as any);
  return sources?.get(sourceId) ?? null;
}

export function getSourceSuspends(
  client: ReplayClientInterface,
  sourceId: ProtocolSourceId
): Source | null {
  const sources = sourcesByIdCache.read(client);
  return sources.get(sourceId) ?? null;
}

const emptySources: Source[] = [];
export function useSources(client: ReplayClientInterface) {
  const cached = useImperativeCacheValue(sourcesCache, client);
  return cached.status === "resolved" ? cached.value : emptySources;
}

const emptySourcesById = new Map<SourceId, Source>();
export function useSourcesById(client: ReplayClientInterface) {
  const cached = useImperativeCacheValue(sourcesByIdCache, client);
  return cached.status === "resolved" ? cached.value : emptySourcesById;
}

const emptySourcesByUrl = new Map<SourceId, Source[]>();
export function useSourcesByUrl(client: ReplayClientInterface) {
  const cached = useImperativeCacheValue(sourcesByUrlCache, client);
  return cached.status === "resolved" ? cached.value : emptySourcesByUrl;
}
