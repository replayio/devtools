import { SourceId } from "@replayio/protocol";
import {
  newSource as ProtocolSource,
  SourceLocation,
  getSourceOutlineResult,
} from "@replayio/protocol";

import { assert } from "protocol/utils";

import { isIndexedSource } from "../suspense/SourcesCache";

export function getSourceFileName(
  source: ProtocolSource,
  appendIndex: boolean = false
): string | null {
  const { url } = source;
  if (!url) {
    return null;
  }

  let fileName = getSourceFileNameFromUrl(url);

  if (appendIndex) {
    if (isIndexedSource(source)) {
      const { contentHashIndex, doesContentHashChange } = source;
      if (doesContentHashChange) {
        fileName = `${fileName} (${contentHashIndex + 1})`;
      }
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

export function isBowerComponent(source: ProtocolSource): boolean {
  if (!source?.url) {
    return false;
  }

  return source.url.includes("bower_components");
}

export function isModuleFromCdn(source?: ProtocolSource): boolean {
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

export function isNodeModule(source?: ProtocolSource): boolean {
  if (!source?.url) {
    return false;
  }

  return source.url.includes("node_modules");
}

export function isSourceMappedSource(sourceId: SourceId, sources: ProtocolSource[]): boolean {
  const source = sources.find(source => source.sourceId === sourceId);
  assert(source, `Source ${sourceId} not found`);
  if (source.kind === "sourceMapped") {
    return true;
  }
  if (source.kind === "prettyPrinted" && source.generatedSourceIds?.length) {
    return isSourceMappedSource(source.generatedSourceIds[0], sources);
  }
  return false;
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
