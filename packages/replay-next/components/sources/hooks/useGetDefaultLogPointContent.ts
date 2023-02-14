import { newSource as ProtocolSource } from "@replayio/protocol";
import { useContext } from "react";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { LineHitCounts } from "shared/client/types";

export default function useGetDefaultLogPointContent({
  lineHitCounts,
  lineNumber,
  source,
}: {
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  source: ProtocolSource;
}): () => string | null {
  const { findClosestFunctionName } = useContext(SourcesContext);

  return () => {
    if (lineHitCounts == null) {
      return null;
    }

    const fileName = source?.url?.split("/")?.pop();

    let content = `"${fileName}", ${lineNumber}`;

    const location = {
      column: lineHitCounts.firstBreakableColumnIndex,
      line: lineNumber,
      sourceId: source.sourceId,
    };

    if (source?.sourceId) {
      const closestFunctionName = findClosestFunctionName(source?.sourceId, location);
      if (closestFunctionName) {
        content = `"${closestFunctionName}", ${lineNumber}`;
      }
    }

    return content;
  };
}
