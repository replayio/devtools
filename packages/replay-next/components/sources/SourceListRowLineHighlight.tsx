import { SameLineSourceLocations } from "@replayio/protocol";
import { memo } from "react";

import { LineHighlight } from "replay-next/components/sources/hooks/useLineHighlights";

import styles from "./SourceListRowLineHighlight.module.css";

export const SourceListRowLineHighlight = memo(function SourceListRowLineHighlight({
  breakablePositionsByLine,
  lineHighlight,
  lineLength,
}: {
  breakablePositionsByLine: Map<number, SameLineSourceLocations>;
  lineHighlight: LineHighlight;
  lineLength: number;
}) {
  switch (lineHighlight.type) {
    case "execution-point":
      const lineNumber = lineHighlight.lineIndex + 1;
      const breakableColumnIndices = breakablePositionsByLine.get(lineNumber)?.columns ?? [];
      const columnBreakpointIndex = breakableColumnIndices.findIndex(
        column => column === lineHighlight.columnIndex
      );

      let highlightColumnBegin: number | null = null;
      let highlightColumnEnd: number | null = null;
      if (columnBreakpointIndex >= 0) {
        highlightColumnBegin = lineHighlight.columnIndex;
        if (columnBreakpointIndex < breakableColumnIndices.length - 1) {
          highlightColumnEnd = breakableColumnIndices[columnBreakpointIndex + 1] - 1;
        } else {
          highlightColumnEnd = lineLength - 1;
        }
      }

      return (
        <>
          <div
            className={styles.CurrentExecutionPoint}
            data-test-name="CurrentExecutionPointLineHighlight"
            data-test-type="preview-location"
          />
          {highlightColumnBegin != null && highlightColumnEnd != null && (
            <div
              className={styles.CurrentExecutionPointColumn}
              style={{
                marginLeft: `${highlightColumnBegin}ch`,
                width: `${highlightColumnEnd - highlightColumnBegin}ch`,
              }}
            />
          )}
        </>
      );
    case "search-result":
      return (
        <div
          className={styles.CurrentExecutionPoint}
          data-test-name="CurrentExecutionPointLineHighlight"
          data-test-type="search-result"
        />
      );
    case "view-source":
      return (
        <div
          className={styles.ViewSourceHighlight}
          data-test-name="ViewSourceHighlight"
          data-test-type="view-source"
        />
      );
    default:
      console.error("Unexpected line highlight type");
      return null;
  }
});
