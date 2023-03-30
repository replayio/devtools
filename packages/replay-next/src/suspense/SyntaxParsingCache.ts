import { ContentType, SourceId } from "@replayio/protocol";
import { StreamingCacheLoadOptions, createStreamingCache } from "suspense";

import { assert } from "protocol/utils";
import {
  StreamingSourceContentsValue,
  streamingSourceContentsCache,
} from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

import { ParsedToken, createIncrementalParser } from "../utils/syntax-parser";

const parseCache = new Map<string, ParsedToken[][]>();

export function parse(code: string, fileName: string) {
  const key = `${fileName}:${code}`;
  const cached = parseCache.get(key);
  if (cached) {
    return cached;
  }

  const parse = createIncrementalParser(fileName);
  const parsedTokens = parse(code, true);
  parseCache.set(key, parsedTokens);
  return parsedTokens;
}

export type StreamingParser = ReturnType<typeof streamingSyntaxParsingCache.stream>;

type StreamingParserAdditionalData = {
  lineCount: number;
  plainText: string[];
};

interface StreamingParserInternalState {
  data: StreamingParserAdditionalData;
  loadOptions: StreamingCacheLoadOptions<ParsedToken[][], StreamingParserAdditionalData>;
  progress: number;
  streaming: StreamingSourceContentsValue;
  value: ParsedToken[][];
}

const internalParserStates = new Map<SourceId, StreamingParserInternalState>();

export const streamingSyntaxParsingCache = createStreamingCache<
  [client: ReplayClientInterface, sourceId: SourceId, fileName: string | null],
  ParsedToken[][],
  StreamingParserAdditionalData
>({
  debugLabel: "StreamingParser",
  getKey: (client, sourceId) => sourceId,
  load: async (loadOptions, client, sourceId, fileName) => {
    assert(!internalParserStates.has(sourceId));

    const streaming = streamingSourceContentsCache.stream(client, sourceId);

    const state: StreamingParserInternalState = {
      data: {
        lineCount: 0,
        plainText: [],
      },
      loadOptions,
      progress: 0,
      streaming,
      value: [],
    };

    internalParserStates.set(sourceId, state);

    const message: PrepareRequest = {
      type: "prepare",
      sourceId,
      fileName,
      contentType: streaming.data?.contentType,
    };

    postWorkerMessage(message);

    let processedLength = 0;

    function processChunk() {
      if (!streaming.data || !streaming.value) {
        return;
      }

      const chunk = streaming.value.slice(processedLength);

      const lines = chunk.split(/\r\n?|\n|\u2028|\u2029/);
      if (state.data.plainText.length > 0) {
        lines[0] = state.data.plainText.pop() + lines[0];
      }

      state.data.lineCount = streaming.data.lineCount;
      state.data.plainText = state.data.plainText.concat(lines);

      loadOptions.update(state.value, state.progress, state.data);

      postWorkerMessage({
        type: "parse",
        sourceId,
        chunk,
        isLastChunk: streaming.complete,
      } as ParseRequest);

      processedLength += chunk.length;
    }

    const unsubscribe = streaming.subscribe(processChunk);

    if (streaming.data?.lineCount !== null) {
      processChunk();
    }

    await streaming.resolver;

    unsubscribe();
  },
});

export interface PrepareRequest {
  type: "prepare";
  contentType?: ContentType | null;
  fileName: string | null;
  sourceId: SourceId;
}

export interface ParseRequest {
  type: "parse";
  chunk: string;
  isLastChunk: boolean;
  sourceId: SourceId;
}

export interface ParseResponse {
  sourceId: SourceId;
  parsedTokens: ParsedToken[][];
  totalParsedLength: number;
}

let worker: Worker | undefined;
function postWorkerMessage(message: PrepareRequest | ParseRequest) {
  const state = internalParserStates.get(message.sourceId);
  assert(state);

  if (!worker) {
    // @ts-ignore
    worker = new Worker(new URL("./SyntaxParsingCacheWorker", import.meta.url));
    worker.onmessage = handleParseResponse;
  }

  worker.postMessage(message);
}

function handleParseResponse({ data }: MessageEvent<ParseResponse>) {
  const state = internalParserStates.get(data.sourceId);
  if (state) {
    assert(state.streaming.data);

    state.value = state.value.concat(data.parsedTokens);
    state.progress = data.totalParsedLength / state.streaming.data.codeUnitCount;
    state.loadOptions.update(state.value, state.progress, state.data);

    if (state.streaming.complete && state.progress === 1) {
      internalParserStates.delete(data.sourceId);

      state.loadOptions.resolve();
    }
  }
}
