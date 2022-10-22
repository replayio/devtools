import Icon from "@bvaughn/components/Icon";
import { AddPoint, DeletePoints, EditPoint } from "@bvaughn/src/contexts/PointsContext";
import { newSource as ProtocolSource } from "@replayio/protocol";
import { CSSProperties, memo } from "react";
import { areEqual } from "react-window";
import { LineNumberToHitCountMap } from "shared/client/types";
import { Point } from "shared/client/types";
import { formatHitCount } from "./formatHitCount";

import PointPanel from "./PointPanel";
import styles from "./SourceListRow.module.css";
import { findPointForLocation } from "./utils/points";

export type ItemData = {
  addPoint: AddPoint;
  currentSearchResultLineIndex: number | null;
  deletePoints: DeletePoints;
  editPoint: EditPoint;
  hitCounts: LineNumberToHitCountMap | null;
  htmlLines: string[];
  lineHeight: number;
  maxHitCount: number | null;
  minHitCount: number | null;
  points: Point[];
  setShowHitCounts: (value: boolean) => void;
  showHitCounts: boolean;
  source: ProtocolSource;
};

const SourceListRow = memo(
  ({ data, index, style }: { data: ItemData; index: number; style: Object }) => {
    const lineNumber = index + 1;

    const {
      addPoint,
      currentSearchResultLineIndex,
      deletePoints,
      editPoint,
      hitCounts,
      htmlLines,
      lineHeight,
      maxHitCount,
      minHitCount,
      points,
      setShowHitCounts,
      showHitCounts,
      source,
    } = data;

    const { sourceId } = source;

    const lineHitCounts = hitCounts?.get(lineNumber) || null;

    const html = htmlLines[index];

    const point = findPointForLocation(points, sourceId, lineNumber);

    const hitCount = lineHitCounts?.count || null;
    const lineHasHits = hitCount !== null && hitCount > 0;

    // We use a gradient to indicate the "heat" (the number of hits).
    // This absolute hit count values are relative, per file.
    // Cubed root prevents high hit counts from lumping all other values together.
    const NUM_GRADIENT_COLORS = 3;
    let hitCountBarClassName = styles.LineHitCountBar0;
    let hitCountLabelClassName = styles.LineHitCountLabel0;
    let hitCountIndex = NUM_GRADIENT_COLORS - 1;
    if (hitCount !== null && minHitCount !== null && maxHitCount !== null) {
      if (minHitCount !== maxHitCount) {
        hitCountIndex = Math.min(
          NUM_GRADIENT_COLORS - 1,
          Math.round(((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS)
        );
      }

      hitCountBarClassName = styles[`LineHitCountBar${hitCountIndex + 1}`];
      hitCountLabelClassName = styles[`LineHitCountLabel${hitCountIndex + 1}`];
    }

    let lineSegments = null;
    let togglePointButton = null;
    if (point?.shouldLog) {
      const { id, location, shouldBreak } = point;

      const togglePoint = () => {
        if (!point.shouldLog || point.shouldBreak) {
          editPoint(point.id, { shouldLog: !point.shouldLog });
        } else {
          deletePoints(point.id);
        }
      };

      togglePointButton = (
        <button
          className={styles.TogglePointButton}
          data-test-name="LogPointToggle"
          data-test-state="on"
          onClick={togglePoint}
        >
          <Icon className={styles.TogglePointButtonIcon} type="remove" />
        </button>
      );

      if (location.column === 0) {
        // Special case; much simpler.
        lineSegments = (
          <>
            <button
              className={styles.BreakpointButton}
              onClick={() => editPoint(id, { shouldBreak: !shouldBreak })}
            >
              <Icon
                className={shouldBreak ? styles.BreakpointIcon : styles.DisabledBreakpointIcon}
                type="breakpoint"
              />
            </button>
            <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: html }} />
          </>
        );
      } else {
        // HACK
        // This could possibly be done in a smarter way?
        const div = document.createElement("div");
        div.innerHTML = html;

        let htmlAfter = "";
        let htmlBefore = "";
        let columnIndex = 0;
        while (div.childNodes.length > 0) {
          const child = div.childNodes[0];

          htmlBefore += (child as HTMLElement).outerHTML || child.textContent;

          child.remove();

          columnIndex += child.textContent?.length || 0;
          if (columnIndex >= location.column) {
            htmlAfter = div.innerHTML;
            break;
          }
        }

        lineSegments = (
          <>
            <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: htmlBefore }} />
            <button
              className={styles.BreakpointButton}
              onClick={() => editPoint(id, { shouldBreak: !shouldBreak })}
            >
              <Icon
                className={shouldBreak ? styles.BreakpointIcon : styles.DisabledBreakpointIcon}
                type="breakpoint"
              />
            </button>
            <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: htmlAfter }} />
          </>
        );
      }
    } else {
      const addLogPoint = () => {
        if (lineHitCounts === null) {
          return;
        }

        const fileName = source?.url?.split("/")?.pop();
        const content = `"${fileName}", ${lineNumber}`;

        if (point) {
          editPoint(point.id, { content, shouldLog: true });
        } else {
          // TODO The legacy app uses the closest function name for the content (if there is one).
          // This app doesn't yet have logic for parsing source contents though.
          addPoint(
            {
              content,
              shouldLog: true,
            },
            {
              column: lineHitCounts.firstBreakableColumnIndex,
              line: lineNumber,
              sourceId,
            }
          );
        }
      };

      togglePointButton = (
        <>
          <button
            className={styles.TogglePointButton}
            data-test-name="LogPointToggle"
            data-test-state="off"
            onClick={addLogPoint}
          >
            <Icon className={styles.TogglePointButtonIcon} type="add" />
          </button>
        </>
      );
      lineSegments = (
        <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: html }} />
      );
    }

    const rowStyle: CSSProperties = {
      ...style,
      // @ts-ignore
      "--line-height": `${lineHeight}px`,
    };

    // TODO [source viewer]
    // Continue to hear button

    const toggleBreakpoint = () => {
      if (lineHitCounts === null) {
        return;
      }

      if (point) {
        if (!point.shouldBreak || point.shouldLog) {
          editPoint(point.id, { shouldBreak: !point.shouldBreak });
        } else {
          deletePoints(point.id);
        }
      } else {
        // TODO The legacy app uses the closest function name for the content (if there is one).
        // This app doesn't yet have logic for parsing source contents though.
        addPoint(
          {
            shouldBreak: true,
          },
          {
            column: lineHitCounts.firstBreakableColumnIndex,
            line: lineNumber,
            sourceId,
          }
        );
      }
    };

    return (
      <div data-test-id={`SourceLine-${lineNumber}`} style={rowStyle}>
        <div
          className={[
            lineHasHits ? styles.LineWithHits : styles.LineWithoutHits,
            currentSearchResultLineIndex === index ? styles.CurrentSearchResultLine : undefined,
          ].join(" ")}
        >
          <div className={styles.LineNumber} data-test-id={`SourceLine-LineNumber-${lineNumber}`}>
            {lineNumber}
            <div
              className={
                point?.shouldBreak ? styles.BreakpointToggleOn : styles.BreakpointToggleOff
              }
              data-test-name="BreakpointToggle"
              data-test-state={point?.shouldBreak ? "on" : "off"}
              onClick={toggleBreakpoint}
            >
              {lineNumber}
            </div>
          </div>

          <div
            className={`${styles.LineHitCountBar} ${hitCountBarClassName}`}
            onClick={() => setShowHitCounts(!showHitCounts)}
          />
          {showHitCounts && (
            <div
              className={`${styles.LineHitCountLabel} ${hitCountLabelClassName}`}
              onClick={() => setShowHitCounts(!showHitCounts)}
            >
              {hitCount !== null ? formatHitCount(hitCount) : ""}
            </div>
          )}

          <div className={styles.LineSegmentsAndPointPanel}>
            {lineSegments}

            {point?.shouldLog && <PointPanel className={styles.PointPanel} point={point} />}

            {togglePointButton}
          </div>
        </div>
      </div>
    );
  },
  areEqual
);

SourceListRow.displayName = "SourceListRow";

export default SourceListRow;
