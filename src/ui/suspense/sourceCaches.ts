import { createCache } from "suspense";

import type { SymbolDeclarations } from "devtools/client/debugger/src/reducers/ast";
import { getSourceContentsAsync } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import { SourceDetails } from "ui/reducers/sources";

// Based on similar logic in `replay-next/src/suspense/SourcesCache`
function urlToContentType(fileName: string): string {
  const extension = fileName.split(".").pop()!.split("?").shift()!;
  switch (extension) {
    case "js":
      return "text/javascript";
    case "jsx":
      return "text/jsx";
    case "ts":
    case "tsx":
      return "text/typescript";
    case "json":
      return "text/json";
    case "html":
      return "text/html";
    case "vue":
      return "text/vue";
    default:
      return "text/javascript";
  }
}

export const sourceSymbolsCache = createCache<
  [sourceId: string, sourceDetails: SourceDetails[], replayClient: ReplayClientInterface],
  SymbolDeclarations | undefined
>({
  debugLabel: "sourceSymbolsCache",
  getKey: sourceId => sourceId,
  load: async (sourceId, sourceDetails, replayClient) => {
    const { parser } = await import("devtools/client/debugger/src/utils/bootstrap");
    const sourceContents = await getSourceContentsAsync(sourceId, replayClient);

    if (sourceContents !== undefined) {
      const { contents, sourceId } = sourceContents;

      const matchingSource = sourceDetails.find(sd => sd.id === sourceId);

      const contentType = urlToContentType(matchingSource?.url ?? "");

      // Our Babel parser worker requires a copy of the source text be sent over first
      parser.setSource(sourceId, {
        type: "text",
        value: contents,
        contentType,
      });
      const symbols = (await parser.getSymbols(sourceId)) as SymbolDeclarations;
      return symbols;
    }
  },
});

export const sourceLinesCache = createCache<
  [sourceId: string, replayClient: ReplayClientInterface],
  string[]
>({
  debugLabel: "sourceLinesCache",
  getKey: sourceId => sourceId,
  load: async (sourceId, replayClient) => {
    const sourceContents = await getSourceContentsAsync(sourceId, replayClient);
    if (!sourceContents) {
      return [];
    }

    const { contents } = sourceContents;

    return contents?.split("\n") ?? [];
  },
});
