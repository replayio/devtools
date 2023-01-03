import { SourceId } from "@replayio/protocol";

import {
  getSourceAsync,
  getStreamingSourceContentsAsync,
} from "replay-next/src/suspense/SourcesCache";
import { parseStreamingAsync } from "replay-next/src/suspense/SyntaxParsingCache";
import { ParsedToken } from "replay-next/src/suspense/SyntaxParsingCache";
import { getBase64Png } from "replay-next/src/utils/canvas";
import { ReplayClientInterface } from "shared/client/types";

export enum CanonicalRequestType {
  CSS,
  FETCH_XHR,
  FONT,
  HTML,
  IMAGE,
  JAVASCRIPT,
  MANIFEST,
  MEDIA,
  OTHER,
  WASM,
  WEBSOCKET,
}

export const COMMENT_TYPE_NETWORK_REQUEST = "network-request";
export const COMMENT_TYPE_SOURCE_CODE = "source-code";
export const COMMENT_TYPE_VISUAL = "visual";

export interface NetworkRequestCommentTypeData {
  id: string;
  method: string;
  name: string;
  status: number | null;
  time: number;
  type: CanonicalRequestType;
}

export interface SourceCodeCommentTypeData {
  columnIndex: number;
  lineNumber: number;
  parsedTokens: ParsedToken[] | null;
  rawText: string | null;
  sourceId: SourceId;
  sourceUrl: string | null;
}

export interface VisualCommentTypeData {
  encodedImage: string | null;
  pageX: number | null;
  pageY: number | null;
  scaledX: number | null;
  scaledY: number | null;
}

export function createTypeDataForNetworkRequestComment(
  requestId: string,
  requestMethod: string,
  requestName: string,
  requestStatus: number | null,
  requestTime: number,
  requestType: CanonicalRequestType
): NetworkRequestCommentTypeData {
  return {
    id: requestId,
    method: requestMethod,
    name: requestName,
    status: requestStatus,
    time: requestTime,
    type: requestType,
  };
}

export async function createTypeDataForSourceCodeComment(
  replayClient: ReplayClientInterface,
  sourceId: SourceId,
  lineNumber: number,
  columnIndex: number,
  maxTextLength = 100
): Promise<SourceCodeCommentTypeData> {
  let parsedTokens: ParsedToken[] | null = null;
  let rawText: string | null = null;

  const source = await getSourceAsync(replayClient, sourceId);
  const sourceUrl = source?.url ?? null;

  // Secondary label is used to store the syntax-highlighted markup for the line
  const streamingSource = await getStreamingSourceContentsAsync(replayClient, sourceId);
  if (streamingSource != null) {
    const parsedSource = await parseStreamingAsync(streamingSource);
    if (parsedSource != null) {
      if (parsedSource.rawTextByLine.length < lineNumber) {
        // If the streaming source hasn't finished loading yet, wait for it to load;
        // Note that it's important to check raw lines as parsed lines may be clipped
        // if the source is larger than the parser has been configured to handle.
        await new Promise<void>(resolve => {
          parsedSource.subscribe(() => {
            if (parsedSource.rawTextByLine.length >= lineNumber) {
              resolve();
            }
          });
        });
      }

      rawText = parsedSource.rawTextByLine[lineNumber - 1];
      if (rawText.length <= maxTextLength) {
        // If the raw text is longer than the max length, we can't safely use the parsed tokens.
        if (parsedSource.parsedTokensByLine.length >= lineNumber) {
          parsedTokens = parsedSource.parsedTokensByLine[lineNumber - 1] ?? null;
        }
      } else {
        rawText = rawText.substring(0, maxTextLength);
      }
    }
  }

  return {
    columnIndex,
    lineNumber,
    parsedTokens,
    rawText,
    sourceId,
    sourceUrl,
  };
}

export async function createTypeDataForVisualComment(
  canvas: HTMLCanvasElement,
  pageX: number | null,
  pageY: number | null
): Promise<VisualCommentTypeData> {
  const encodedImage = await getBase64Png(canvas, {
    maxWidth: 300,
    maxHeight: 300,
  });

  let scaledX: number | null = null;
  let scaledY: number | null = null;
  if (pageX !== null && pageY !== null) {
    const { height, left, top, width } = canvas.getBoundingClientRect();

    scaledX = (pageX - left) / width;
    scaledY = (pageY - top) / height;
  }

  return {
    encodedImage,
    pageX,
    pageY,
    scaledX,
    scaledY,
  };
}

export function isNetworkRequestCommentTypeData(
  type: string | null,
  typeData: any
): typeData is NetworkRequestCommentTypeData {
  return type === COMMENT_TYPE_NETWORK_REQUEST && typeData != null;
}

export function isSourceCodeCommentTypeData(
  type: string | null,
  typeData: any
): typeData is SourceCodeCommentTypeData {
  return type === COMMENT_TYPE_SOURCE_CODE && typeData != null;
}

export function isVisualCommentTypeData(
  type: string | null,
  typeData: any
): typeData is VisualCommentTypeData {
  return type === COMMENT_TYPE_VISUAL && typeData != null;
}
