import { newSource as ProtocolSource } from "@replayio/protocol";

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
