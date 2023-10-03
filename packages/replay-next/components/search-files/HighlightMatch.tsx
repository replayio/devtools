import { ReactNode, useMemo } from "react";

import { findMatches } from "replay-next/components/search-files/findMatches";

import styles from "./HighlightMatch.module.css";

export default function HighlightMatch({
  caseSensitive,
  needle,
  text,
}: {
  caseSensitive: boolean;
  needle: string;
  text: string;
}) {
  const tuples = useMemo(
    () => findMatches(text, needle, caseSensitive),
    [caseSensitive, needle, text]
  );

  let children: ReactNode[] = [];
  tuples.forEach(([nonMatch, match]) => {
    if (nonMatch) {
      children.push(<span key={children.length}>{nonMatch}</span>);
    }
    if (match) {
      children.push(
        <mark className={styles.Match} key={children.length}>
          {match}
        </mark>
      );
    }
  });

  return children as any;
}
