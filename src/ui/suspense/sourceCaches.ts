import type { SymbolDeclarations } from "devtools/client/debugger/src/reducers/ast";
import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import { getSourceContentsAsync } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

export const {
  getValueAsync: getSymbolsAsync,
  getStatus: getSymbolsStatus,
  getValueSuspense: getSymbolsSuspense,
} = createGenericCache<
  [replayClient: ReplayClientInterface],
  [sourceId: string],
  SymbolDeclarations | undefined
>(
  "sourceSymbolsCache",
  1,
  async (replayClient, sourceId) => {
    const { parser } = await import("devtools/client/debugger/src/utils/bootstrap");
    const sourceContents = await getSourceContentsAsync(replayClient, sourceId);

    if (sourceContents !== undefined) {
      const { contents, contentType } = sourceContents;

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
