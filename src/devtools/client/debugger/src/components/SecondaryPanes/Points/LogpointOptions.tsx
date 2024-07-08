import { SyntaxHighlighter } from "replay-next/components/SyntaxHighlighter/SyntaxHighlighter";
import { Point } from "shared/client/types";

import styles from "./LogpointOptions.module.css";

export default function LogpointOptions({ point }: { point: Point }) {
  const { condition, content } = point;

  let children = null;
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

  return <div className={styles.Options}>{children}</div>;
}
