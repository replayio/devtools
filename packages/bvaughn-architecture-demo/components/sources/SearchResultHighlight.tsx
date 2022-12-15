import { ReactNode } from "react";

import styles from "./SearchResultHighlight.module.css";

export default function SearchResultHighlight({
  columnBreakpointIndex,
  isActive,
  searchResultColumnIndex: searchResultColumnStartIndex,
  searchText,
}: {
  columnBreakpointIndex: number | null;
  isActive: boolean;
  searchResultColumnIndex: number;
  searchText: string;
}) {
  const searchResultColumnEndIndex = searchResultColumnStartIndex + searchText.length;

  const breakpointMarkerIsWithinHighlight =
    columnBreakpointIndex !== null &&
    columnBreakpointIndex < searchResultColumnEndIndex &&
    columnBreakpointIndex > searchResultColumnStartIndex;

  let markers: ReactNode = null;

  if (breakpointMarkerIsWithinHighlight) {
    // A column breakpoint is in the middle of this search result highlight.
    // The highlight needs to be split into parts around the breakpoint marker.

    const index = columnBreakpointIndex - searchResultColumnStartIndex;
    const textStart = searchText.substring(0, index);
    const textEnd = searchText.substring(index);

    markers = (
      <>
        <span
          className={isActive ? styles.ActiveMark : styles.InactiveMark}
          style={{ marginLeft: `${searchResultColumnStartIndex + 1}ch` }}
        >
          {textStart}
        </span>
        <div className={styles.ColumnBreakpointSpacer} />
        <span className={isActive ? styles.ActiveMark : styles.InactiveMark}>{textEnd}</span>
      </>
    );
  } else {
    const breakpointMarkerIsBeforeHighlight =
      columnBreakpointIndex !== null && columnBreakpointIndex <= searchResultColumnStartIndex;

    markers = (
      <>
        {breakpointMarkerIsBeforeHighlight && <div className={styles.ColumnBreakpointSpacer} />}
        <span
          className={isActive ? styles.ActiveMark : styles.InactiveMark}
          style={{ marginLeft: `${searchResultColumnStartIndex + 1}ch` }}
        >
          {searchText}
        </span>
      </>
    );
  }

  return (
    <pre
      className={styles.Highlight}
      data-test-name="SourceSearchResultHighlight"
      data-test-search-state={isActive ? "active" : "inactive"}
    >
      {markers}
    </pre>
  );
}
