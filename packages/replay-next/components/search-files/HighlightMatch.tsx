import { ReactNode, useMemo } from "react";

import styles from "./HighlightMatch.module.css";

export default function HighlightMatch({ needle, text }: { needle: string; text: string }) {
  const pieces = useMemo(() => text.split(needle), [needle, text]);

  let children: ReactNode[] = [];
  for (let index = 0; index < pieces.length; index++) {
    const piece = pieces[index];

    children.push(<span key={index}>{piece}</span>);

    if (index < pieces.length - 1) {
      children.push(
        <span className={styles.Match} key={`${index}-needle`}>
          {needle}
        </span>
      );
    }
  }

  return children as any;
}
