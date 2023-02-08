import React, { Suspense, useContext, useMemo } from "react";

import Loader from "replay-next/components/Loader";
import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";
import { getSourceLinesSuspense } from "ui/suspense/sourceCaches";

import styles from "./BreakpointOptions.module.css";

type BreakpointProps = {
  type: "breakpoint" | "logpoint";
  breakpoint: Point;
};

function BreakpointLineContents({ breakpoint }: BreakpointProps) {
  const replayClient = useContext(ReplayClientContext);
  const { sourceId } = breakpoint.location;

  const sourceLines = getSourceLinesSuspense(replayClient, sourceId);

  const snippet = useMemo(() => {
    const { column, line } = breakpoint.location;
    let snippet = "";

    if (sourceLines.length > 0) {
      const lineText = sourceLines[line - 1];
      return lineText.slice(column, column! + 100).trim();
    }

    return snippet;
  }, [sourceLines, breakpoint]);

  if (!snippet) {
    return null;
  }

  return <SyntaxHighlightedLine code={snippet} />;
}

export default function BreakpointOptions({ breakpoint, type }: BreakpointProps) {
  const { condition, content } = breakpoint;

  let children = null;
  if (type === "logpoint") {
    if (condition) {
      children = (
        <>
          <span className={styles.Label}>
            if(
            <SyntaxHighlightedLine code={condition} />)
          </span>
          <span className={styles.Label}>
            log(
            <SyntaxHighlightedLine code={content} />)
          </span>
        </>
      );
    } else {
      children = (
        <span className={styles.Label}>
          <SyntaxHighlightedLine code={content} />
        </span>
      );
    }
  } else {
    children = (
      <span className={styles.Label}>
        <Suspense fallback={<Loader />}>
          <BreakpointLineContents breakpoint={breakpoint} type={type} />
        </Suspense>
      </span>
    );
  }

  return <div className={styles.Options}>{children}</div>;
}
