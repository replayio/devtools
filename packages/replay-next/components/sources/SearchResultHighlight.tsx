import { ReactNode } from "react";

import styles from "./SearchResultHighlight.module.css";

export default function SearchResultHighlight({
  breakableColumnIndices,
  isActive,
  searchResultColumnIndex: searchResultColumnStartIndex,
  searchText,
  showColumnBreakpoints,
}: {
  breakableColumnIndices: number[];
  isActive: boolean;
  searchResultColumnIndex: number;
  searchText: string;
  showColumnBreakpoints: boolean;
}) {
  const searchResultColumnEndIndex = searchResultColumnStartIndex + searchText.length;
  const className = isActive ? styles.ActiveMark : styles.InactiveMark;

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

  if (showColumnBreakpoints) {
    for (let index = 0; index < breakableColumnIndices.length; index++) {
      const breakableColumnIndex = breakableColumnIndices[index];

      if (columnIndex < breakableColumnIndex) {
        const charIndexStart = columnIndex - searchResultColumnStartIndex;
        if (charIndexStart < searchText.length) {
          const charIndexEnd = breakableColumnIndex - searchResultColumnStartIndex;
          const text = searchText.substring(charIndexStart, charIndexEnd);
          children.push(
            <span className={className} key={children.length}>
              {text}
            </span>
          );
        }

        columnIndex = breakableColumnIndex;
      }

      children.push(<div className={styles.ColumnBreakpointSpacer} key={children.length} />);
    }
  }

  if (columnIndex < searchResultColumnEndIndex) {
    const charIndexStart = columnIndex - searchResultColumnStartIndex;
    const text = searchText.substring(charIndexStart);
    children.push(
      <span className={className} key={children.length}>
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
