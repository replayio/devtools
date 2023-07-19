import {
  ContentType as ProtocolContentType,
  Source as ProtocolSource,
  SourceId as ProtocolSourceId,
  SourceKind as ProtocolSourceKind,
  SourceId,
} from "@replayio/protocol";
import { StreamingCache, StreamingValue, createStreamingCache } from "suspense";

import { ArrayMap, assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

export type ProtocolSourceContents = {
  contents: string;
  contentType: ProtocolContentType;
};

// TODO Move this to "replay-next/src/types"
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

export type SourcesCacheValue = {
  idToSource: Map<SourceId, Source>;
  sources: Source[];
  urlToSources: Map<string, Source[]>;
};

export const sourcesCache = createStreamingCache<
  [client: ReplayClientInterface],
  SourcesCacheValue
>({
  debugLabel: "StreamingSourceContents",
  getKey: () => "sources",
  load: async ({ update, reject, resolve }, client) => {
    try {
      const idToSource: Map<SourceId, Source> = new Map();
      const sources: Source[] = [];
      const urlToSources: Map<string, Source[]> = new Map();

      const mapSource = createSourceMapper();

      await client.findSources((newSources: ProtocolSource[]) => {
        newSources.forEach(newSource => {
          const source = mapSource(newSource);
          sources.push(source);

          idToSource.set(source.sourceId, source);

          if (source.url) {
            const sourceArray = urlToSources.get(source.url);
            if (sourceArray) {
              sourceArray.push(source);
            } else {
              urlToSources.set(source.url, [source]);
            }
          }
        });

        update({ idToSource, sources, urlToSources });

        return true;
      });

      resolve();
    } catch (error) {
      reject(error);
    }
  },
});

function createSourceMapper(): (protocolSource: ProtocolSource) => Source {
  const idToProtocolSourceMap = new Map<ProtocolSourceId, ProtocolSource>();
  const keyToCorrespondingSourceIdsMap = new ArrayMap<string, ProtocolSourceId>();
  // The ProtocolSource links original source to generated sources; this map tracks the reverse
  const generatedIdToOriginalIdMap = new ArrayMap<ProtocolSourceId, ProtocolSourceId>();
  const generatedIdToPrettyPrintedIdMap = new Map<ProtocolSourceId, ProtocolSourceId>();
  const urlToFirstProtocolSourceMap: Map<ProtocolSourceId, ProtocolSource> = new Map();
  const urlsThatChangeSet: Set<ProtocolSourceId> = new Set();

  return function mapSource(protocolSource: ProtocolSource): Source {
    let { contentHash, contentId, generatedSourceIds, kind, sourceId, url } = protocolSource;

    if (kind === "prettyPrinted") {
      assert(
        generatedSourceIds?.length === 1,
        `pretty-printed source ${sourceId} should have exactly one generated source`
      );

      const minifiedSource = idToProtocolSourceMap.get(generatedSourceIds[0]);
      assert(minifiedSource, `couldn't find minified source for ${sourceId}`);
      contentHash = minifiedSource.contentHash;

      generatedIdToPrettyPrintedIdMap.set(generatedSourceIds[0], sourceId);
    }
    assert(contentHash, `couldn't determine contentHash for ${sourceId}`);

    // Sources with the same key should be grouped as corresponding sources
    const key = `${kind}:${url}:${contentHash}`;

    keyToCorrespondingSourceIdsMap.add(key, sourceId);

    for (const generatedSourceId of generatedSourceIds || []) {
      generatedIdToOriginalIdMap.add(generatedSourceId, sourceId);
    }

    if (url) {
      if (urlToFirstProtocolSourceMap.has(url)) {
        const firstSource = urlToFirstProtocolSourceMap.get(url)!;
        const { contentId: prevContentId, kind: prevKind } = firstSource;
        if (kind === prevKind && contentId !== prevContentId) {
          urlsThatChangeSet.add(url);
        }
      } else {
        urlToFirstProtocolSourceMap.set(url, protocolSource);
      }
    }

    const urlToIndex: Map<string, number> = new Map();

    let contentIdIndex = 0;
    let doesContentIdChange = false;
    if (url) {
      doesContentIdChange = urlsThatChangeSet.has(url);

      const index = urlToIndex.get(url) || 0;
      contentIdIndex = index;
      urlToIndex.set(url, index + 1);
    }

    const isSourceMapped =
      kind === "prettyPrinted"
        ? idToProtocolSourceMap.get(generatedSourceIds![0])!.kind === "sourceMapped"
        : kind === "sourceMapped";

    const source: Source = {
      id: sourceId,
      sourceId,
      kind,
      url,
      contentId,
      contentIdIndex,
      doesContentIdChange,
      isSourceMapped,
      correspondingSourceIds: keyToCorrespondingSourceIdsMap.map.get(key)!,
      generated: generatedSourceIds ?? [],
      generatedFrom: generatedIdToOriginalIdMap.map.get(sourceId) ?? [],
      prettyPrinted: generatedIdToPrettyPrintedIdMap.get(sourceId),
      prettyPrintedFrom: kind === "prettyPrinted" ? generatedSourceIds![0] : undefined,
    };

    return source;
  };
}

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
