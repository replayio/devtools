import { newSource as ProtocolSource } from "@replayio/protocol";

import { isIndexedSource } from "../suspense/SourcesCache";

export function getSourceFileName(
  source: ProtocolSource,
  prependIndex: boolean = false
): string | null {
  const { url } = source;
  if (!url) {
    return null;
  }

  let fileName = getSourceFileNameFromUrl(url);

  if (prependIndex) {
    if (isIndexedSource(source)) {
      const { contentHashIndex, doesContentHashChange } = source;
      if (doesContentHashChange) {
        fileName = `${fileName} (${contentHashIndex + 1})`;
      }
    }
  }

  return fileName;
}

function getSourceFileNameFromUrl(url: string): string | null {
  const fileName = url.split("/")?.pop();
  return fileName || null;
}
