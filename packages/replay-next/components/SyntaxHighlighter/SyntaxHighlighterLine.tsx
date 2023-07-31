import { ParsedToken, parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";

import styles from "./SyntaxHighlighterLine.module.css";

export function SyntaxHighlighterLine({
  className,
  tokens,
}: {
  className: string;
  tokens: ParsedToken[];
}) {
  const html = parsedTokensToHtml(tokens);

  return (
    <div
      className={`${styles.Line} ${className}`}
      dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}
    />
  );
}
