import React, { Suspense, useContext, useMemo } from "react";

import Loader from "replay-next/components/Loader";
import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";
import { getSourceLinesSuspense } from "ui/suspense/sourceCaches";

type BreakpointProps = {
  type: "breakpoint" | "logpoint";
  breakpoint: Point;
};

function BreakpointLineContents({ breakpoint }: BreakpointProps) {
  const replayClient = useContext(ReplayClientContext);
  const { sourceId } = breakpoint;

  const sourceLines = getSourceLinesSuspense(replayClient, sourceId);

  const snippet = useMemo(() => {
    const { columnIndex, lineNumber = 0 } = breakpoint;
    let snippet = "";

    if (sourceLines.length > 0) {
      const lineText = sourceLines[lineNumber - 1];
      return lineText.slice(columnIndex, columnIndex! + 100).trim();
    }

    return snippet;
  }, [sourceLines, breakpoint]);

  if (!snippet) {
    return null;
  }

  return <SyntaxHighlightedLine code={snippet} />;
}

export default function BreakpointOptions({ breakpoint, type }: BreakpointProps) {
  let children = null;
  if (type === "logpoint") {
    if (breakpoint.condition) {
      children = (
        <>
          <span className="breakpoint-label cm-s-mozilla devtools-monospace">
            if(
            <SyntaxHighlightedLine code={breakpoint.condition} />)
          </span>
          <span className="breakpoint-label cm-s-mozilla devtools-monospace">
            log(
            <SyntaxHighlightedLine code={breakpoint.content} />)
          </span>
        </>
      );
    } else {
      children = (
        <span className="breakpoint-label cm-s-mozilla devtools-monospace">
          <SyntaxHighlightedLine code={breakpoint.content} />
        </span>
      );
    }
  } else {
    children = (
      <span className="breakpoint-label cm-s-mozilla devtools-monospace">
        <Suspense fallback={<Loader />}>
          <BreakpointLineContents breakpoint={breakpoint} type={type} />
        </Suspense>
      </span>
    );
  }

  return <div className="breakpoint-options">{children}</div>;
}
