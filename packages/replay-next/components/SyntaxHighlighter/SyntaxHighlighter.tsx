import { HTMLAttributes, ReactNode, memo, useMemo } from "react";

import { formatExpressionToken } from "replay-next/components/console/utils/formatExpressionToken";
import { SyntaxHighlighterLine } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighterLine";
import { parse } from "replay-next/src/suspense/SyntaxParsingCache";
import { ParsedToken } from "replay-next/src/utils/syntax-parser";

import styles from "./SyntaxHighlighter.module.css";

type LineRendererFunction = ({
  className,
  lineNumber,
  tokens,
}: {
  className: string;
  lineNumber: number;
  tokens: ParsedToken[];
}) => ReactNode;

export const SyntaxHighlighter = memo(function SyntaxHighlighter({
  className = "",
  code,
  fileExtension,
  lineClassName = "",
  lineRenderer = defaultLineRenderer,
  ...rest
}: {
  className?: string;
  code: string;
  fileExtension: string;
  lineClassName?: string;
  lineRenderer?: LineRendererFunction;
} & HTMLAttributes<HTMLDivElement>) {
  const parsedTokens = parse(code, fileExtension);

  const formattedTokens = useMemo(
    () => parsedTokens.map(tokens => tokens.map(formatExpressionToken)),
    [parsedTokens]
  );

  return (
    <div className={`${styles.SyntaxHighlighter} ${className}`} title={code} {...rest} data-private>
      {formattedTokens.map((tokens, index) =>
        lineRenderer({
          className: lineClassName,
          lineNumber: index + 1,
          tokens,
        })
      )}
    </div>
  );
});

function defaultLineRenderer({
  className,
  lineNumber,
  tokens,
}: {
  className: string;
  lineNumber: number;
  tokens: ParsedToken[];
}) {
  return <SyntaxHighlighterLine className={className} key={lineNumber} tokens={tokens} />;
}
