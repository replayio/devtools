import { ReactNode, useLayoutEffect, useRef, useState } from "react";

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

  const breakpointMarkerIsBeforeHighlight =
    columnBreakpointIndex !== null && columnBreakpointIndex <= searchResultColumnStartIndex;
  const breakpointMarkerIsWithinHighlight =
    columnBreakpointIndex !== null &&
    columnBreakpointIndex < searchResultColumnEndIndex &&
    columnBreakpointIndex > searchResultColumnStartIndex;

  const ref = useRef<HTMLPreElement>(null);

  const [breakpointMarkerOffset, setBreakpointMarkerOffset] = useState(0);

  useLayoutEffect(() => {
    if (breakpointMarkerIsBeforeHighlight || breakpointMarkerIsWithinHighlight) {
      const pre = ref.current;
      if (pre) {
        const style = getComputedStyle(pre);
        const offset = style.getPropertyValue("--column-breakpoint-width");
        setBreakpointMarkerOffset(parseInt(offset));
      }
    }
  }, [breakpointMarkerIsBeforeHighlight, breakpointMarkerIsWithinHighlight]);

  let markers: ReactNode | ReactNode[] = null;

  if (breakpointMarkerIsWithinHighlight) {
    // A column breakpoint is in the middle of this search result highlight.
    // The highlight needs to be split into parts around the breakpoint marker.

    const index = columnBreakpointIndex - searchResultColumnStartIndex;
    const textStart = searchText.substring(0, index);
    const textEnd = searchText.substring(index);

    markers = [
      <Marker
        breakpointMarkerOffset={0}
        columnOffset={searchResultColumnStartIndex + 1}
        isActive={isActive}
        key="start"
        text={textStart}
      />,
      <Marker
        breakpointMarkerOffset={breakpointMarkerOffset}
        columnOffset={0}
        isActive={isActive}
        key="end"
        text={textEnd}
      />,
    ];
  } else {
    markers = (
      <Marker
        breakpointMarkerOffset={breakpointMarkerIsBeforeHighlight ? breakpointMarkerOffset : 0}
        columnOffset={searchResultColumnStartIndex + 1}
        isActive={isActive}
        text={searchText}
      />
    );
  }

  return (
    <pre className={styles.Highlight} ref={ref}>
      {markers}
    </pre>
  );
}

function Marker({
  breakpointMarkerOffset,
  columnOffset,
  isActive,
  text,
}: {
  breakpointMarkerOffset: number;
  columnOffset: number;
  isActive: boolean;
  text: string;
}) {
  const marginLeft =
    breakpointMarkerOffset > 0
      ? `calc(${columnOffset}ch + ${breakpointMarkerOffset}px)`
      : `${columnOffset}ch`;

  return (
    <span className={isActive ? styles.ActiveMark : styles.InactiveMark} style={{ marginLeft }}>
      {text}
    </span>
  );
}
