import { SourceId } from "@replayio/protocol";

import {
  getSourceAsync,
  getStreamingSourceContentsAsync,
} from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { parseStreamingAsync } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";
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
      if (parsedSource.parsedLines.length < lineNumber) {
        await new Promise<void>(resolve => {
          parsedSource.subscribe(() => {
            if (parsedSource.parsedLines.length >= lineNumber) {
              resolve();
            }
          });
        });
      }

      const rawLine = parsedSource.rawLines[lineNumber - 1];
      if (rawLine.length > MAX_LABEL_CHARS) {
        secondaryLabel = truncate(rawLine, { maxLength: MAX_LABEL_CHARS, position: "middle" });
      } else {
        secondaryLabel = parsedSource.parsedLines[lineNumber - 1] || null;
      }
    }
  }

  return { primaryLabel, secondaryLabel };
}
