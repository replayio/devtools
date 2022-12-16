import { SourceId } from "@replayio/protocol";

import {
  getSourceAsync,
  getStreamingSourceContentsAsync,
} from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import {
  parseStreamingAsync,
  parsedTokensToHtml,
} from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";
import { getSourceFileName } from "bvaughn-architecture-demo/src/utils/source";
import { truncate } from "bvaughn-architecture-demo/src/utils/text";
import { ReplayClientInterface } from "shared/client/types";

type CommentLabels = {
  primaryLabel: string | null;
  secondaryLabel: string | null;
};

const MAX_LABEL_CHARS = 100;

export async function createSourceLocationLabels(
  replayClient: ReplayClientInterface,
  sourceId: SourceId,
  lineNumber: number,
  columnIndex: number | null = null
): Promise<CommentLabels> {
  let primaryLabel: string | null = null;
  let secondaryLabel: string | null = null;

  // Primary label is used to store the source file name and line number
  const source = await getSourceAsync(replayClient, sourceId);
  if (source) {
    const fileName = getSourceFileName(source);
    if (fileName) {
      primaryLabel =
        columnIndex !== null
          ? `${fileName}:${lineNumber}:${columnIndex}`
          : `${fileName}:${lineNumber}`;

      if (primaryLabel.length > MAX_LABEL_CHARS) {
        primaryLabel = truncate(primaryLabel, { maxLength: MAX_LABEL_CHARS, position: "start" });
      }
    }
  }

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

      const rawLine = parsedSource.rawTextByLine[lineNumber - 1];
      if (
        parsedSource.parsedTokensByLine.length >= lineNumber &&
        rawLine.length <= MAX_LABEL_CHARS
      ) {
        secondaryLabel = parsedTokensToHtml(
          parsedSource.parsedTokensByLine[lineNumber - 1] ?? null
        );
      } else {
        // Secondary label is expected to be HTML for source code.
        // That's true even if we don't have any actual syntax highlighted markup to show.
        const element = document.createElement("span");
        element.textContent = truncate(rawLine, { maxLength: MAX_LABEL_CHARS, position: "middle" });

        secondaryLabel = element.outerHTML;
      }
    }
  }

  return { primaryLabel, secondaryLabel };
}
