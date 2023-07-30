import { useMemo } from "react";

import { formatExpressionToken } from "replay-next/components/console/utils/formatExpressionToken";
import { useJsonViewerContextMenu } from "replay-next/components/JsonViewer/useJsonViewerContextMenu";
import { parse } from "replay-next/src/suspense/SyntaxParsingCache";
import { ParsedToken, parsedTokensToHtml } from "replay-next/src/utils/syntax-parser";

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
      <div className={styles.JsonViewer} onContextMenu={onContextMenu} title={jsonText}>
        {formattedTokens.map((tokens, index) => (
          <Line key={index} tokens={tokens} />
        ))}
      </div>
      {contextMenu}
    </>
  );
}

function Line({ tokens }: { tokens: ParsedToken[] }) {
  const html = parsedTokensToHtml(tokens);

  return <div className={styles.Line} dangerouslySetInnerHTML={{ __html: html }} />;
}
