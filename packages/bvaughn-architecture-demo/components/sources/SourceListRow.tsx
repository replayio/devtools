import Icon from "@bvaughn/components/Icon";
import { AddPoint, DeletePoints, EditPoint } from "@bvaughn/src/contexts/PointsContext";
import { newSource as ProtocolSource } from "@replayio/protocol";
import { memo, MouseEvent } from "react";
import { areEqual } from "react-window";
import { LineNumberToHitCountMap } from "shared/client/types";
import { Point } from "shared/client/types";
import { formatHitCount } from "./formatHitCount";

import PointPanel from "./PointPanel";
import { HoveredState } from "./Source";
import styles from "./SourceListRow.module.css";
import getExpressionForTokenElement from "./utils/getExpressionForTokenElement";

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
  setHoveredState: (state: HoveredState | null) => void;
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
      setHoveredState,
      source,
    } = data;

    const { sourceId } = source;

    const lineHitCounts = hitCounts?.get(lineNumber) || null;

    const numLines = htmlLines.length;
    const maxLineNumberStringLength = `${numLines}`.length;

    const html = htmlLines[index];

    const point = points.find(
      point => point.location.sourceId === sourceId && point.location.line === lineNumber
    );

    const hitCount = lineHitCounts?.count || null;
    const lineHasHits = hitCount !== null && hitCount > 0;

    const onAddPointButtonClick = async (lineNumber: number) => {
      if (lineHitCounts === null) {
        return;
      }

      const closestColumnNumber = lineHitCounts.firstBreakableColumnIndex;
      const fileName = source?.url?.split("/")?.pop();

      // TODO The legacy app uses the closest function name for the content (if there is one).
      // This app doesn't yet have logic for parsing source contents though.
      addPoint(
        {
          content: `"${fileName}", ${lineNumber}`,
          shouldLog: true,
        },
        {
          column: closestColumnNumber,
          line: lineNumber,
          sourceId,
        }
      );
    };

    // We use a gradient to indicate the "heat" (the number of hits).
    // This absolute hit count values are relative, per file.
    // Cubed root prevents high hit counts from lumping all other values together.
    const NUM_GRADIENT_COLORS = 3;
    let hitCountLabelClassName = styles.LineHitCounts0;
    let hitCountIndex = NUM_GRADIENT_COLORS - 1;
    if (hitCount !== null && minHitCount !== null && maxHitCount !== null) {
      if (minHitCount !== maxHitCount) {
        hitCountIndex = Math.min(
          NUM_GRADIENT_COLORS - 1,
          Math.round(((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS)
        );
      }

      hitCountLabelClassName = styles[`LineHitCounts${hitCountIndex + 1}`];
    }

    const onMouseMove = ({ currentTarget, target }: MouseEvent) => {
      const rowElement = currentTarget as HTMLElement;
      const tokenElement = target as HTMLElement;

      const expression = getExpressionForTokenElement(rowElement, tokenElement);

      setHoveredState(expression ? { expression, target: tokenElement } : null);
    };

    let togglePointButton = null;
    let lineSegments = null;
    if (point) {
      const { id, location, shouldBreak } = point;

      togglePointButton = (
        <button
          className={styles.RemovePointButton}
          data-test-name="RemovePointButton"
          onClick={() => deletePoints(id)}
        >
          <Icon className={styles.Icon} type="remove" />
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
            <pre
              className={styles.LineSegment}
              dangerouslySetInnerHTML={{ __html: html }}
              onMouseMove={onMouseMove}
            />
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
            <pre
              className={styles.LineSegment}
              dangerouslySetInnerHTML={{ __html: htmlBefore }}
              onMouseMove={onMouseMove}
            />
            <button
              className={styles.BreakpointButton}
              onClick={() => editPoint(id, { shouldBreak: !shouldBreak })}
            >
              <Icon
                className={shouldBreak ? styles.BreakpointIcon : styles.DisabledBreakpointIcon}
                type="breakpoint"
              />
            </button>
            <pre
              className={styles.LineSegment}
              dangerouslySetInnerHTML={{ __html: htmlAfter }}
              onMouseMove={onMouseMove}
            />
          </>
        );
      }
    } else {
      togglePointButton = (
        <>
          <button
            className={styles.AddPointButton}
            data-test-name="AddPointButton"
            onClick={() => onAddPointButtonClick(lineNumber)}
          >
            <Icon className={styles.Icon} type="add" />
          </button>
        </>
      );
      lineSegments = (
        <pre
          className={styles.LineSegment}
          dangerouslySetInnerHTML={{ __html: html }}
          onMouseMove={onMouseMove}
        />
      );
    }

    return (
      <div data-test-id={`SourceLine-${lineNumber}`} style={style}>
        <div
          className={[
            lineHasHits ? styles.LineWithHits : styles.LineWithoutHits,
            currentSearchResultLineIndex === index ? styles.CurrentSearchResultLine : undefined,
          ].join(" ")}
        >
          <div
            className={`${styles.LineHitCounts} ${hitCountLabelClassName}`}
            style={{ height: `${lineHeight}px` }}
          >
            {hitCount !== null ? formatHitCount(hitCount) : ""}
          </div>
          {togglePointButton}
          <div
            className={styles.LineNumber}
            data-test-id={`SourceLine-LineNumber-${lineNumber}`}
            style={{
              width: `${maxLineNumberStringLength}ch`,
            }}
          >
            {lineNumber}
          </div>
          {lineSegments}
        </div>
        {point && <PointPanel className={styles.PointPanel} point={point} />}
      </div>
    );
  },
  areEqual
);

SourceListRow.displayName = "SourceListRow";

export default SourceListRow;
