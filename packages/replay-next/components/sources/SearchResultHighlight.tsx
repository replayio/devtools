import { ReactNode, useLayoutEffect, useRef } from "react";

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
  const searchResultColumnEndIndex = searchResultColumnStartIndex + searchText.length;
  const className = isActive ? styles.ActiveMark : styles.InactiveMark;

  const markRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isActive) {
      // Horizontally scroll if needed.
      markRef.current?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
    }
  }, [isActive]);

  let children: ReactNode[] = [
    <div
      className={styles.LeadingSpacer}
      key={0}
      style={{
        marginLeft: `${searchResultColumnStartIndex + 1}ch`,
      }}
    />,
  ];

  let columnIndex = searchResultColumnStartIndex;

  if (columnIndex < searchResultColumnEndIndex) {
    const charIndexStart = columnIndex - searchResultColumnStartIndex;
    const text = searchText.substring(charIndexStart);
    children.push(
      <span className={className} key={children.length} ref={markRef}>
        {text}
      </span>
    );
  }

  return (
    <pre
      className={styles.Highlight}
      data-test-name="SourceSearchResultHighlight"
      data-test-search-state={isActive ? "active" : "inactive"}
    >
      {children}
    </pre>
  );
}
