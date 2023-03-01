import React, { Suspense, useContext, useMemo } from "react";

import Loader from "replay-next/components/Loader";
import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { getStreamingSourceContentsSuspense } from "replay-next/src/suspense/SourcesCache";
import { getParsedValueIfCached } from "replay-next/src/suspense/SyntaxParsingCache";
import { ParsedToken } from "replay-next/src/suspense/SyntaxParsingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import styles from "./BreakpointOptions.module.css";

type BreakpointProps = {
  type: "breakpoint" | "logpoint";
  breakpoint: Point;
};

function BreakpointLineContents({ breakpoint }: BreakpointProps) {
  const replayClient = useContext(ReplayClientContext);
  const { sourceId } = breakpoint.location;

  const streamingSourceContent = getStreamingSourceContentsSuspense(replayClient, sourceId);
  const parsed = getParsedValueIfCached(streamingSourceContent, null)?.value;

  const parsedTokensByLine = parsed?.parsedTokensByLine;
  const rawTextByLine = parsed?.rawTextByLine;

  const { snippet, tokens } = useMemo((): { snippet: string; tokens: ParsedToken[] } => {
    const { column, line } = breakpoint.location;
    let snippet = "";
    let tokens: ParsedToken[] = [];

    if (
      rawTextByLine &&
      rawTextByLine.length > 0 &&
      parsedTokensByLine &&
      parsedTokensByLine[line - 1]
    ) {
      const lineText = rawTextByLine[line - 1];
      tokens = parsedTokensByLine[line - 1].slice(
        parsedTokensByLine[line - 1].findIndex(parsedToken => parsedToken.columnIndex === column)
      );
      return { snippet: lineText.slice(column, column! + 100).trim(), tokens };
    }

    return { snippet, tokens };
  }, [rawTextByLine, parsedTokensByLine, breakpoint]);

  if (!snippet || !tokens) {
    return null;
  }

  return <SyntaxHighlightedLine code={snippet} tokens={tokens} />;
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
          ;
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
