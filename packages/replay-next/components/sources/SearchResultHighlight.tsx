import { useLayoutEffect, useRef } from "react";

import styles from "./SearchResultHighlight.module.css";

export default function SearchResultHighlight({
  isActive,
  searchResultColumnIndex: searchResultColumnStartIndex,
  searchText,
}: {
  isActive: boolean;
  searchResultColumnIndex: number;
  searchText: string;
}) {
  const markRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isActive) {
      // Horizontally scroll if needed.
      markRef.current?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
    }
  }, [isActive]);

  return (
    <mark
      className={isActive ? styles.ActiveMark : styles.InactiveMark}
      data-test-name="SourceSearchResultHighlight"
      data-test-search-state={isActive ? "active" : "inactive"}
      style={{
        marginLeft: `${searchResultColumnStartIndex}ch`,
      }}
    >
      {searchText}
    </mark>
  );
}
