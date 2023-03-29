import { ContentType, SourceId } from "@replayio/protocol";
import { createStreamingCache } from "suspense";

import { assert } from "protocol/utils";

import { ParsedToken, createIncrementalParser } from "../utils/syntax-parser";
import { StreamingSourceContents } from "./SourcesCache";

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

interface StreamingParserInternalState {
  totalLength: number | null;
  rawText: string[];
  rawProgress: number;
  parsedTokens: ParsedToken[][];
  parsedProgress: number;
  update: (parsedTokens: ParsedToken[][], progress: number, rawText: RawText) => void;
  resolve: () => void;
}

const internalParserStates = new Map<SourceId, StreamingParserInternalState>();

interface RawText {
  text: string[];
  progress: number;
}

export const streamingSyntaxParsingCache = createStreamingCache<
  [source: StreamingSourceContents, fileName: string | null],
  ParsedToken[][],
  RawText
>({
  debugLabel: "StreamingParser",
  getKey: source => source.sourceId,
  load: ({ update, resolve }, source, fileName) => {
    const sourceId = source.sourceId;
    assert(!internalParserStates.has(sourceId));
    const state: StreamingParserInternalState = {
      totalLength: source.codeUnitCount,
      rawText: [],
      rawProgress: 0,
      parsedTokens: [],
      parsedProgress: 0,
      update,
      resolve,
    };
    internalParserStates.set(sourceId, state);

    const message: PrepareRequest = {
      type: "prepare",
      sourceId,
      fileName,
      contentType: source.contentType,
    };
    postWorkerMessage(message);

    let processedLength = 0;
    function processChunk() {
      if (!source.contents) {
        return;
      }

      state.totalLength = source.codeUnitCount;

      const chunk = source.contents.slice(processedLength);

      const lines = chunk.split(/\r\n?|\n|\u2028|\u2029/);
      lines[0] = state.rawText.pop() + lines[0];
      state.rawText = state.rawText.concat(lines);
      state.rawProgress = source.contents.length / source.codeUnitCount!;
      update(state.parsedTokens, state.parsedProgress, {
        text: state.rawText,
        progress: state.rawProgress,
      });

      const message: ParseRequest = {
        type: "parse",
        sourceId,
        chunk,
        isLastChunk: source.complete,
      };
      postWorkerMessage(message);

      processedLength += chunk.length;
    }

    source.subscribe(processChunk);

    if (source.lineCount !== null) {
      processChunk();
    }
  },
});

export interface PrepareRequest {
  type: "prepare";
  sourceId: SourceId;
  fileName: string | null;
  contentType?: ContentType | null;
}

export interface ParseRequest {
  type: "parse";
  sourceId: SourceId;
  chunk: string;
  isLastChunk: boolean;
}

export interface ParseResponse {
  sourceId: SourceId;
  parsedTokens: ParsedToken[][];
  totalParsedLength: number;
}

let worker: Worker | undefined;
function postWorkerMessage(message: PrepareRequest | ParseRequest) {
  if (!worker) {
    // @ts-ignore
    worker = new Worker(new URL("./SyntaxParsingCacheWorker", import.meta.url));
    worker.onmessage = handleParseResponse;
  }
  worker.postMessage(message);
}

function handleParseResponse({ data }: MessageEvent<ParseResponse>) {
  const state = internalParserStates.get(data.sourceId);
  assert(state);
  state.parsedTokens = state.parsedTokens.concat(data.parsedTokens);
  state.parsedProgress = data.totalParsedLength / state.totalLength!;
  state.update(state.parsedTokens, state.parsedProgress, {
    text: state.rawText,
    progress: state.rawProgress,
  });
  if (state.parsedProgress === 1) {
    state.resolve();
    internalParserStates.delete(data.sourceId);
  }
}
