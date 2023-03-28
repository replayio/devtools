import React, { Suspense, useContext, useMemo } from "react";
import { useStreamingValue } from "suspense";

import Loader from "replay-next/components/Loader";
import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { streamingSyntaxParsingCache } from "replay-next/src/suspense/SyntaxParsingCache";
import { ParsedToken } from "replay-next/src/utils/syntax-parser";
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

  const parsedStream = streamingSyntaxParsingCache.stream(replayClient, sourceId, null);
  const { data, value } = useStreamingValue(parsedStream);

  const parsedTokensByLine = value;
  const plainTextByLine = data!.plainText;

  const { snippet, tokens } = useMemo((): { snippet: string; tokens: ParsedToken[] } => {
    const { column, line } = breakpoint.location;
    let snippet = "";
    let tokens: ParsedToken[] = [];

    if (plainTextByLine && plainTextByLine[line - 1]) {
      const lineText = plainTextByLine[line - 1];
      snippet = lineText.slice(column, column! + 100).trim();
    }

    if (parsedTokensByLine && parsedTokensByLine[line - 1]) {
      const lineTokens = parsedTokensByLine[line - 1];
      tokens = lineTokens.slice(
        lineTokens.findIndex(parsedToken => parsedToken.columnIndex === column)
      );
    }

    return { snippet, tokens };
  }, [plainTextByLine, parsedTokensByLine, breakpoint]);

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
