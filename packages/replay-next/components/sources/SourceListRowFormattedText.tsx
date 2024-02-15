import { ReactNode, memo } from "react";

import { getClassNames, isTokenInspectable } from "replay-next/components/sources/utils/tokens";
import { ParsedToken } from "replay-next/src/utils/syntax-parser";

import styles from "./SourceListRowFormattedText.module.css";

// Primarily exists as a way for e2e tests to disable syntax highlighting
// to simulate large files that aren't fully parsed.
let disableSyntaxHighlighting = false;
let disableSyntaxHighlightingOverLength = 500;
if (typeof window !== "undefined") {
  const url = new URL(window?.location?.href);
  let param = url.searchParams.get("disableSyntaxHighlightingOverLength");
  if (param != null) {
    disableSyntaxHighlightingOverLength = parseInt(param, 10);
  }

  param = param = url.searchParams.get("disableSyntaxHighlighting");
  if (param != null) {
    disableSyntaxHighlighting = true;
  }
}

export const SourceListRowFormattedText = memo(
  ({
    parsedTokens,
    plainText,
  }: {
    parsedTokens: ParsedToken[] | null;
    plainText: string | null;
  }) => {
    if (plainText === null || parsedTokens === null || disableSyntaxHighlighting) {
      return <div className={styles.Text}>{plainText}</div>;
    }

    let renderedTextLength = 0;
    let renderedTokens: ReactNode[] = [];

    for (let index = 0; index < parsedTokens.length; index++) {
      if (renderedTextLength > disableSyntaxHighlightingOverLength) {
        renderedTokens.push(<span key={index}>{plainText.substring(renderedTextLength)}</span>);
        break;
      }

      const token = parsedTokens[index];
      const classNames = getClassNames(token);
      const inspectable = isTokenInspectable(token);

      renderedTokens.push(
        <span
          className={classNames.join(" ") || undefined}
          data-column-index={token.columnIndex}
          data-inspectable-token={inspectable || undefined}
          key={index}
        >
          {token.value}
        </span>
      );

      renderedTextLength += token.value.length;
    }

    return (
      <div className={styles.Text} data-test-formatted-source="true">
        {renderedTokens}
      </div>
    );
  }
);

SourceListRowFormattedText.displayName = "SourceListRowFormattedText";
