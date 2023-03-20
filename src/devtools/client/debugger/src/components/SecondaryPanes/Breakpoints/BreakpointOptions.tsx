import React, { Suspense, useContext, useMemo } from "react";

import Loader from "replay-next/components/Loader";
import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { ParsedToken } from "replay-next/src/utils/syntax-parser";
import { streamingSourceContentsCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";
import { streamingSyntaxParsingCache } from "replay-next/src/suspense/SyntaxParsingCache";

import styles from "./BreakpointOptions.module.css";
import { useStreamingValue } from "suspense";

type BreakpointProps = {
  type: "breakpoint" | "logpoint";
  breakpoint: Point;
};

function BreakpointLineContents({ breakpoint }: BreakpointProps) {
  const replayClient = useContext(ReplayClientContext);
  const { sourceId } = breakpoint.location;

  // TODO use useStreamingValue() for this
  // once streamingSourceContentsCache has been migrated to "suspense"
  const streamingSourceContents = streamingSourceContentsCache.read(replayClient,sourceId);
  const parsedStream = streamingSyntaxParsingCache.stream(streamingSourceContents,null);
  const {data, value}= useStreamingValue(parsedStream);

  const parsedTokensByLine = value;
  const rawTextByLine = data?.text;  

  const { snippet, tokens } = useMemo((): { snippet: string; tokens: ParsedToken[] } => {
    const { column, line } = breakpoint.location;
    let snippet = "";
    let tokens: ParsedToken[] = [];

    if (rawTextByLine && rawTextByLine[line - 1]) {
      const lineText = rawTextByLine[line - 1];
      snippet = lineText.slice(column, column! + 100).trim();
    }

    if (parsedTokensByLine && parsedTokensByLine[line - 1]) {
      const lineTokens = parsedTokensByLine[line - 1];
      tokens = lineTokens.slice(
        lineTokens.findIndex(parsedToken => parsedToken.columnIndex === column)
      );
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
