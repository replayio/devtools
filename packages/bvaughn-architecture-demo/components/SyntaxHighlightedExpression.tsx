import jsTokens, { Token } from "js-tokens";
import { useMemo } from "react";

import styles from "./SyntaxHighlightedExpression.module.css";

export default function SyntaxHighlightedExpression({ expression }: { expression: string }) {
  const tokens = useMemo<Token[]>(() => parseExpression(expression), [expression]);
  return (
    <>
      {tokens.map((token, index) => (
        <span className={styles[token.type] || ""} key={index}>
          {token.value}
        </span>
      ))}
    </>
  );
}

function parseExpression(expression: string): Token[] {
  // Wrap with "[...]" so the expression is valid.
  const tokens: Token[] = Array.from(jsTokens(`[${expression}]`));

  // Remove the "[]" wrappers.
  return tokens.slice(1, tokens.length - 1);
}
