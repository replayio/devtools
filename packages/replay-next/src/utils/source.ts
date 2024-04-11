import { SourceId, SourceLocation, getSourceOutlineResult } from "@replayio/protocol";

import { assert } from "protocol/utils";

import { Source } from "../suspense/SourcesCache";

const VISIBLE_LINES_BUCKET_SIZE = 100;

// This should be more than large enough to fetch breakpoints
// for any typical source file in one request, while also
// being smaller than giant files that would cause the backend
// to choke on serializing the entire file's data.
const BREAKPOINT_POSITIONS_LINE_BUCKET_SIZE = 5000;

export function bucketVisibleLines(
  startLineIndex: number,
  stopLineIndex: number
): [startLineIndex: number, stopLineIndex: number] {
  return bucketLines(startLineIndex, stopLineIndex, VISIBLE_LINES_BUCKET_SIZE);
}

export function bucketBreakpointLines(
  startLineIndex: number,
  stopLineIndex: number
): [startLineIndex: number, stopLineIndex: number] {
  return bucketLines(startLineIndex, stopLineIndex, BREAKPOINT_POSITIONS_LINE_BUCKET_SIZE);
}

export function bucketLines(
  startLineIndex: number,
  stopLineIndex: number,
  bucketSize: number
): [startLineIndex: number, stopLineIndex: number] {
  const startBucket = Math.floor(startLineIndex / bucketSize);
  const stopBucket = Math.floor(stopLineIndex / bucketSize) + 1;

  return [startBucket * bucketSize, stopBucket * bucketSize - 1];
}

export function getSourceFileName(source: Source, appendIndex: boolean = false): string | null {
  const { url } = source;
  if (!url) {
    return null;
  }

  let fileName = getSourceFileNameFromUrl(url);

  if (appendIndex) {
    const { contentIdIndex, doesContentIdChange } = source;
    if (doesContentIdChange) {
      fileName = `${fileName} (${contentIdIndex + 1})`;
    }
  }

  return fileName;
}

export function getSourceFileNameFromUrl(url: string): string | null {
  let fileName = url.split("/")?.pop();
  if (fileName == "") {
    fileName = "(index)";
  }

  return fileName || null;
}

export function isBowerComponent(source: Source): boolean {
  if (!source?.url) {
    return false;
  }

  return source.url.includes("bower_components");
}

export function isModuleFromCdn(source?: Source): boolean {
  if (!source?.url) {
    return false;
  }

  // This is not an exhaustive list of CDNs.
  return (
    source.url.includes("cdnjs.com") ||
    source.url.includes("jsdelivr.com") ||
    source.url.includes("unpkg.com")
  );
}

export function isNodeModule(source?: Source): boolean {
  if (!source?.url) {
    return false;
  }

  return source.url.includes("node_modules");
}

export function isSourceMappedSource(sourceId: SourceId, sources: Map<SourceId, Source>): boolean {
  const source = sources.get(sourceId);
  assert(source, `Source ${sourceId} not found`);
  return source.isSourceMapped;
}

export function findFunctionNameForLocation(
  location: SourceLocation,
  sourceOutline: getSourceOutlineResult
) {
  let foundFunctionName: string | undefined;
  let foundFunctionBegin: SourceLocation | undefined;
  for (const functionOutline of sourceOutline.functions) {
    const functionBegin = functionOutline.body || functionOutline.location.begin;
    const functionEnd = functionOutline.location.end;
    if (
      isLocationBefore(functionBegin, location) &&
      isLocationBefore(location, functionEnd) &&
      (!foundFunctionBegin || isLocationBefore(foundFunctionBegin, functionBegin))
    ) {
      foundFunctionName = functionOutline.name;
      foundFunctionBegin = functionBegin;
    }
  }
  return foundFunctionName;
}

export function isLocationBefore(a: SourceLocation, b: SourceLocation) {
  if (a.line < b.line) {
    return true;
  } else if (a.line > b.line) {
    return false;
  } else {
    return a.column <= b.column;
  }
}
