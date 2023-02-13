import type { SymbolDeclarations } from "devtools/client/debugger/src/reducers/ast";
import { getSymbols } from "devtools/client/debugger/src/workers/parser/getSymbols";
import { setSource } from "devtools/client/debugger/src/workers/parser/sources";
import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
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

export const {
  getValueAsync: getSymbolsAsync,
  getStatus: getSymbolsStatus,
  getValueSuspense: getSymbolsSuspense,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [sourceId: string, sourceDetails: SourceDetails[]],
  SymbolDeclarations | undefined
>(
  "sourceSymbolsCache",
  1,
  async (replayClient, sourceId, sourceDetails) => {
    // const { parser } = await import("devtools/client/debugger/src/utils/bootstrap");
    const sourceContents = await getSourceContentsAsync(replayClient, sourceId);

    if (sourceContents !== undefined) {
      const { contents, sourceId } = sourceContents;

      const matchingSource = sourceDetails.find(sd => sd.id === sourceId);

      const contentType = urlToContentType(matchingSource?.url ?? "");

      // Our Babel parser worker requires a copy of the source text be sent over first
      // parser.setSource(sourceId, {
      //   type: "text",
      //   value: contents,
      //   contentType,
      // });

      console.log("Parsing symbols: ", sourceId, contents);

      setSource({
        id: sourceId,
        text: contents,
        contentType,
      });
      const symbols = getSymbols(sourceId) as SymbolDeclarations;

      // const symbols = (await parser.getSymbols(sourceId)) as SymbolDeclarations;
      return symbols;
    }
  },
  sourceId => sourceId
);

export const { getValueAsync: getSourceLinesAsync, getValueSuspense: getSourceLinesSuspense } =
  createGenericCache<[replayClient: ReplayClientInterface], [sourceId: string], string[]>(
    "sourceLinesCache",
    1,
    async (replayClient, sourceId) => {
      const sourceContents = await getSourceContentsAsync(replayClient, sourceId);
      if (!sourceContents) {
        return [];
      }

      const { contents } = sourceContents;

      return contents?.split("\n") ?? [];
    },
    sourceId => sourceId
  );
