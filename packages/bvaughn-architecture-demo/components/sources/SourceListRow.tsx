import Icon from "@bvaughn/components/Icon";
import { AddPoint, DeletePoints, EditPoint } from "@bvaughn/src/contexts/PointsContext";
import { newSource as ProtocolSource } from "@replayio/protocol";
import { CSSProperties, Fragment, memo, MouseEvent } from "react";
import { areEqual } from "react-window";
import { LineNumberToHitCountMap } from "shared/client/types";
import { Point } from "shared/client/types";

import PointPanel from "./PointPanel";
import { HoveredState } from "./Source";
import styles from "./SourceListRow.module.css";

export type ItemData = {
  addPoint: AddPoint;
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
    const html = htmlLines[index];
    const maxHitCountStringLength = maxHitCount === null ? 0 : `${maxHitCount}`.length;
    const maxLineNumberStringLength = `${numLines}`.length;

    const point = points.find(
      point => point.location.sourceId === sourceId && point.location.line === lineNumber
    );

    const lineHasHits = lineHitCounts !== null;
    const hitCount = lineHitCounts?.count || null;

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
    let hitCountBarClassName = styles.LineHitCount0;
    let hitCountLabelClassName = styles.LineHitCountLabel0;
    let hitCountIndex = NUM_GRADIENT_COLORS - 1;
    if (hitCount !== null && minHitCount !== null && maxHitCount !== null) {
      if (minHitCount !== maxHitCount) {
        hitCountIndex = Math.min(
          NUM_GRADIENT_COLORS - 1,
          Math.round(((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS)
        );
      }

      hitCountBarClassName = styles[`LineHitCount${hitCountIndex + 1}`];
      hitCountLabelClassName = styles[`LineHitCountLabel${hitCountIndex + 1}`];
    }

    const onMouseMove = (event: MouseEvent) => {
      const expression = getCurrentExpression(event);
      setHoveredState(expression ? { expression, target: event.target as HTMLElement } : null);
    };

    // Gutter needs to be  wide enough to fit the largest line number.
    const gutterWidthStyle: CSSProperties = {
      width: `${maxLineNumberStringLength}ch`,
    };

    let hoverButton = null;
    let lineSegments = null;
    if (point) {
      const { id, location, shouldBreak } = point;

      hoverButton = (
        <button className={styles.ToggleButton} onClick={() => deletePoints(id)}>
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

          htmlBefore += child.hasOwnProperty("outerHTML")
            ? (child as HTMLElement).outerHTML
            : child.textContent;

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
      hoverButton = (
        <>
          <button className={styles.ToggleButton} onClick={() => onAddPointButtonClick(lineNumber)}>
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
        <div className={lineHasHits ? styles.LineWithHits : styles.LineWithoutHits}>
          <div className={styles.LineNumber} style={gutterWidthStyle}>
            {lineNumber}
            {hoverButton}
          </div>
          <div className={hitCountBarClassName} style={{ height: `${lineHeight}px` }} />
          <div
            className={hitCountLabelClassName}
            style={{ width: `${maxHitCountStringLength + 1}ch` }}
          >
            {hitCount !== null ? hitCount : ""}
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

function getCurrentExpression({ currentTarget, target }: MouseEvent): string | null {
  let currentNode = target as HTMLElement;
  if (currentNode.tagName === "PRE") {
    return null;
  }

  switch (currentNode.className) {
    case "tok-operator":
    case "tok-punctuation":
      return null;
  }

  const parentNode = currentTarget as HTMLElement;
  const children = Array.from(parentNode.childNodes);

  let expression = currentNode.textContent!;
  while (currentNode != null) {
    const index = children.indexOf(currentNode);
    if (index < 1) {
      break;
    }

    currentNode = children[index - 1] as HTMLElement;
    if (currentNode.nodeName === "#text") {
      break;
    }

    if (currentNode.className !== "tok-punctuation") {
      expression = currentNode.textContent + expression;
    }

    if (currentNode.textContent !== ".") {
      break;
    }
  }

  return expression.startsWith(".") ? expression.slice(1) : expression;
}
