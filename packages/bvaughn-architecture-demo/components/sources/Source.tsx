import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import {
  AddPoint,
  DeletePoints,
  EditPoint,
  PointsContext,
} from "@bvaughn/src/contexts/PointsContext";
import {
  getCachedMinMaxSourceHitCounts,
  getSourceContents,
  getSourceHitCounts,
} from "@bvaughn/src/suspense/SourcesCache";
import { highlight } from "@bvaughn/src/suspense/TokenizerCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import {
  newSource as ProtocolSource,
  SourceId as ProtocolSourceId,
  SourceId,
} from "@replayio/protocol";
import { Fragment, memo, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { LineHitCounts } from "shared/client/types";
import { Point } from "shared/client/types";

import PointPanel from "./PointPanel";
import styles from "./Source.module.css";

// TODO Add a real source viewer built on top of Code Mirror, Monoco, or Lexical.

export default function Source({
  source,
  sourceId,
}: {
  source: ProtocolSource;
  sourceId: ProtocolSourceId;
}) {
  const client = useContext(ReplayClientContext);

  const { range: focusRange } = useContext(FocusContext);
  const { addPoint, deletePoints, editPoint, points } = useContext(PointsContext);

  const fileName = getSourceFileName(source, true) || "unknown";

  const sourceContents = getSourceContents(client, sourceId);

  const { lines, locationRange } = useMemo(() => {
    const lines = sourceContents.contents.split("\n");
    const locationRange = {
      start: { line: 0, column: 0 },
      end: { line: lines.length - 1, column: Number.MAX_SAFE_INTEGER },
    };
    return {
      lines,
      locationRange,
    };
  }, [sourceContents]);

  const hitCounts = getSourceHitCounts(client, sourceId, locationRange, focusRange);
  const [minHitCount, maxHitCount] = getCachedMinMaxSourceHitCounts(sourceId, focusRange);

  const code = sourceContents.contents;
  const htmlLines = highlight(code);
  if (htmlLines === null) {
    return null;
  }

  return (
    <div className={styles.Source} data-test-id={`Source-${fileName}`}>
      <div className={styles.SourceContents}>
        {htmlLines.map((html, index) => {
          const lineNumber = index + 1;
          const point = points.find(
            point => point.location.sourceId === sourceId && point.location.line === lineNumber
          );

          return (
            <MemoizedLine
              addPoint={addPoint}
              deletePoints={deletePoints}
              editPoint={editPoint}
              html={html}
              key={index}
              lineHitCounts={hitCounts.get(lineNumber) || null}
              lineNumber={lineNumber}
              maxHitCount={maxHitCount}
              minHitCount={minHitCount}
              point={point || null}
              source={source}
              sourceId={sourceId}
            />
          );
        })}
      </div>
    </div>
  );
}

const MemoizedLine = memo(function Line({
  addPoint,
  deletePoints,
  editPoint,
  html,
  lineHitCounts,
  lineNumber,
  maxHitCount,
  minHitCount,
  point,
  source,
  sourceId,
}: {
  addPoint: AddPoint;
  deletePoints: DeletePoints;
  editPoint: EditPoint;
  html: string;
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  maxHitCount: number | null;
  minHitCount: number | null;
  point: Point | null;
  source: ProtocolSource;
  sourceId: SourceId;
}) {
  const maxHitCountStringLength = maxHitCount === null ? 0 : `${maxHitCount}`.length;

  const lineHasHits = lineHitCounts !== null;
  const hitCount = lineHitCounts?.count || 0;

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
  if (hitCount > 0 && minHitCount !== null && maxHitCount !== null) {
    if (minHitCount !== maxHitCount) {
      hitCountIndex = Math.min(
        NUM_GRADIENT_COLORS - 1,
        Math.round(((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS)
      );
    }

    hitCountBarClassName = styles[`LineHitCount${hitCountIndex + 1}`];
    hitCountLabelClassName = styles[`LineHitCountLabel${hitCountIndex + 1}`];
  }

  let hoverButton = null;
  let lineSegments = null;
  if (point) {
    const { id, location, shouldBreak } = point;

    hoverButton = (
      <button className={styles.Button} onClick={() => deletePoints(id)}>
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
    hoverButton = (
      <>
        <button className={styles.Button} onClick={() => onAddPointButtonClick(lineNumber)}>
          <Icon className={styles.Icon} type="add" />
        </button>
      </>
    );
    lineSegments = (
      <pre className={styles.LineSegment} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  return (
    <Fragment>
      <div
        className={lineHasHits ? styles.LineWithHits : styles.LineWithoutHits}
        data-test-id={`SourceLine-${lineNumber}`}
      >
        <div className={styles.LineNumber}>{lineNumber}</div>
        {hoverButton}
        <div className={hitCountBarClassName} />
        <div
          className={hitCountLabelClassName}
          style={{ width: `${maxHitCountStringLength + 1}ch` }}
        >
          {hitCount > 0 ? hitCount : ""}
        </div>
        {lineSegments}
      </div>
      {point && <PointPanel className={styles.PointPanel} point={point} />}
    </Fragment>
  );
});
