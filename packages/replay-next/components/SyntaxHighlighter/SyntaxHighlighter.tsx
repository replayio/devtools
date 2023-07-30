import { HTMLAttributes, memo, useMemo } from "react";

import { formatExpressionToken } from "replay-next/components/console/utils/formatExpressionToken";
import { SyntaxHighlighterLine } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighterLine";
import { parse } from "replay-next/src/suspense/SyntaxParsingCache";

import styles from "./SyntaxHighlighter.module.css";

export const SyntaxHighlighter = memo(function SyntaxHighlighter({
  className = "",
  code,
  fileExtension,
  lineClassName = "",
  ...rest
}: {
  className?: string;
  code: string;
  fileExtension: string;
  lineClassName?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const parsedTokens = parse(code, fileExtension);

  const formattedTokens = useMemo(
    () => parsedTokens.map(tokens => tokens.map(formatExpressionToken)),
    [parsedTokens]
  );

  return (
    <div className={`${styles.SyntaxHighlighter} ${className}`} title={code} {...rest}>
      {formattedTokens.map((tokens, index) => (
        <SyntaxHighlighterLine className={lineClassName} key={index} tokens={tokens} />
      ))}
    </div>
  );
});
