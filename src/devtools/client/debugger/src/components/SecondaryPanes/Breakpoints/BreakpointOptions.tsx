import { Suspense, useContext, useMemo } from "react";
import { useStreamingValue } from "suspense";

import Loader from "replay-next/components/Loader";
import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { streamingSyntaxParsingCache } from "replay-next/src/suspense/SyntaxParsingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import styles from "./BreakpointOptions.module.css";

type BreakpointProps = {
  type: "breakpoint" | "logpoint";
  breakpoint: Point;
};

const EMPTY_ARRAY: any[] = [];

function BreakpointLineContents({ breakpoint }: BreakpointProps) {
  const replayClient = useContext(ReplayClientContext);
  const { sourceId } = breakpoint.location;

  const parsedStream = streamingSyntaxParsingCache.stream(replayClient, sourceId, null);
  const { data } = useStreamingValue(parsedStream);

  const plainTextByLine = data?.plainText ?? EMPTY_ARRAY;

  const snippet = useMemo((): string => {
    const { column, line } = breakpoint.location;
    let snippet = "";

    if (plainTextByLine && plainTextByLine[line - 1]) {
      const lineText = plainTextByLine[line - 1];
      snippet = lineText.slice(column, column! + 100).trim();
    }

    return snippet;
  }, [plainTextByLine, breakpoint]);

  if (!snippet) {
    return null;
  }

  return <SyntaxHighlighter code={snippet} fileExtension=".js" />;
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
            <SyntaxHighlighter code={condition} fileExtension=".js" />)
          </span>
          <span className={styles.Label}>
            log(
            <SyntaxHighlighter code={content} fileExtension=".js" />)
          </span>
        </>
      );
    } else {
      children = (
        <span className={styles.Label}>
          <SyntaxHighlighter code={content} fileExtension=".js" />
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
