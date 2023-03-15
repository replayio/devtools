import { ContentType, SourceId } from "@replayio/protocol";

import { assert } from "protocol/utils";

import { IncrementalParser, createIncrementalParser } from "../utils/syntax-parser";
import { ParseRequest, ParseResponse, PrepareRequest } from "./SyntaxParsingCache";

interface ParserState {
  parse: IncrementalParser;
  parsedLength: number;
}

const parserStates = new Map<SourceId, ParserState>();

self.onmessage = ({ data }: MessageEvent<PrepareRequest | ParseRequest>) => {
  if (data.type === "prepare") {
    prepare(data.sourceId, data.fileName, data.contentType);
  } else {
    parse(data.sourceId, data.chunk, data.isLastChunk);
  }
};

function prepare(sourceId: SourceId, fileName: string | null, contentType?: ContentType | null) {
  assert(!parserStates.has(sourceId));
  parserStates.set(sourceId, {
    parse: createIncrementalParser(fileName, contentType),
    parsedLength: 0,
  });
}

function parse(sourceId: SourceId, chunk: string, isLastChunk: boolean) {
  const parserState = parserStates.get(sourceId);
  assert(parserState);

  const parsedTokens = parserState.parse(chunk, isLastChunk);
  parserState.parsedLength += chunk.length;

  const message: ParseResponse = {
    sourceId,
    parsedTokens,
    totalParsedLength: parserState.parsedLength,
  };
  postMessage(message);
}
