import { useMemo } from "react";

import { formatExpressionToken } from "replay-next/components/console/utils/formatExpressionToken";
import { useJsonViewerContextMenu } from "replay-next/components/JsonViewer/useJsonViewerContextMenu";
import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";
import { parse } from "replay-next/src/suspense/SyntaxParsingCache";

import styles from "./JsonViewer.module.css";

export function JsonViewer({ jsonText }: { jsonText: string }) {
  const parsedTokens = parse(jsonText, "json");
  const formattedTokens = useMemo(
    () => parsedTokens.map(tokens => tokens.map(formatExpressionToken)),
    [parsedTokens]
  );

  const { contextMenu, onContextMenu } = useJsonViewerContextMenu(jsonText);

  return (
    <>
      <div className={styles.JsonViewer} onContextMenu={onContextMenu}>
        {formattedTokens.map((tokens, index) => (
          <SyntaxHighlightedLine
            className={styles.Line}
            code={jsonText}
            fileExtension="json"
            key={index}
            tokens={tokens}
          />
        ))}
      </div>
      {contextMenu}
    </>
  );
}
