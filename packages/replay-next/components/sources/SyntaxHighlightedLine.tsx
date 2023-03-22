import { Suspense } from "react";

import { parse } from "replay-next/src/suspense/SyntaxParsingCache";
import { ParsedToken, parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";

import Loader from "../Loader";
import styles from "./SyntaxHighlightedLine.module.css";

type Props = { code: string; className?: string; fileExtension?: string; tokens?: ParsedToken[] };

export default function SyntaxHighlightedLine({
  className = "",
  code,
  fileExtension,
  tokens,
}: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <SyntaxHighlightedLineSuspends
        className={className}
        code={code}
        fileExtension={fileExtension}
        tokens={tokens}
      />
    </Suspense>
  );
}

function SyntaxHighlightedLineSuspends({
  code,
  className = "",
  fileExtension = ".js",
  tokens = [],
}: Props) {
  if (tokens.length === 0) {
    const parsed = parse(code, fileExtension);
    if (parsed && parsed.length > 0) {
      tokens = parsed[0];
    }
  }

  const html = parsedTokensToHtml(tokens);

  return (
    <span
      className={`${className} ${styles.Code}`}
      dangerouslySetInnerHTML={{ __html: html }}
      title={code}
    />
  );
}
