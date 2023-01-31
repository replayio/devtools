import type { SymbolDeclarations } from "devtools/client/debugger/src/reducers/ast";
import { createGenericCache } from "replay-next/src/suspense/createGenericCache";
import {
  StreamingSourceContents,
  getStreamingSourceContentsHelper,
} from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";

export const {
  getValueAsync: getSourceContentsAsync,
  getValueSuspense: getSourceContentsSuspense,
  getStatus: getSourceContentsStatus,
} = createGenericCache<
  [replayClient: ReplayClientInterface, sourceId: string],
  StreamingSourceContents | undefined
>(
  "sourceContentsCache",
  async (replayClient, sourceId) => {
    const res = await getStreamingSourceContentsHelper(replayClient, sourceId);
    if (res) {
      // Ensure that follow-on caches have the entire text available
      const sourceContents = await res.resolver;
      return sourceContents;
    }
  },
  (replayClient, sourceId) => sourceId
);

export const {
  getValueAsync: getSymbolsAsync,
  getStatus: getSymbolsStatus,
  getValueSuspense: getSymbolsSuspense,
} = createGenericCache<
  [replayClient: ReplayClientInterface, sourceId: string],
  SymbolDeclarations | undefined
>(
  "sourceSymbolsCache",
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
  (replayClient, sourceId) => sourceId
);

export const { getValueAsync: getSourceLinesAsync, getValueSuspense: getSourceLinesSuspense } =
  createGenericCache<[replayClient: ReplayClientInterface, sourceId: string], string[]>(
    "sourceLinesCache",
    async (replayClient, sourceId) => {
      const sourceContents = await getSourceContentsAsync(replayClient, sourceId);
      if (!sourceContents) {
        return [];
      }

      const { contents } = sourceContents;

      return contents?.split("\n") ?? [];
    },
    (replayClient, sourceId) => sourceId
  );
