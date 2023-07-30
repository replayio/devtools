import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { useJsonViewerContextMenu } from "replay-next/components/SyntaxHighlighter/useJsonViewerContextMenu";

import styles from "./JsonViewer.module.css";

export function JsonViewer({ className = "", jsonText }: { className?: string; jsonText: string }) {
  const { contextMenu, onContextMenu } = useJsonViewerContextMenu(jsonText);

  return (
    <>
      <SyntaxHighlighter
        className={`${styles.JsonViewer} ${className}`}
        code={jsonText}
        fileExtension=".json"
        lineClassName={styles.Line}
        onContextMenu={onContextMenu}
      />
      {contextMenu}
    </>
  );
}
