import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import {
  getCachedMinMaxSourceHitCounts,
  getSourceContents,
  getSourceHitCounts,
} from "@bvaughn/src/suspense/SourcesCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { newSource as ProtocolSource, SourceId as ProtocolSourceId } from "@replayio/protocol";
import { Fragment, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

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

  const fileName = getSourceFileName(source) || "unknown";

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

  const onAddPointButtonClick = (lineNumber: number) => {
    const lineHasHits = hitCounts.has(lineNumber);
    if (!lineHasHits) {
      return;
    }

    const hitCountsForLine = hitCounts.get(lineNumber)!;
    const closestColumnNumber = hitCountsForLine.columnHits[0]!.location.column;
    const fileName = source?.url?.split("/")?.pop();

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

  return (
    <div className={styles.Source} data-test-id={`Source-${fileName}`}>
      <div className={styles.SourceContents}>
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const lineHasHits = hitCounts.has(lineNumber);
          const hitCount = hitCounts?.get(lineNumber)?.columnHits?.[0].hits || 0;

          // We use a gradient to indicate the "heat" (the number of hits).
          // This absolute hit count values are relative, per file.
          // Cubed root prevents high hit counts from lumping all other values together.
          const NUM_GRADIENT_COLORS = 3;
          let hitCountClassName = styles.LineHitCount0;
          let hitCountIndex = NUM_GRADIENT_COLORS - 1;
          if (hitCount > 0 && minHitCount !== null && maxHitCount !== null) {
            if (minHitCount !== maxHitCount) {
              hitCountIndex = Math.min(
                NUM_GRADIENT_COLORS - 1,
                Math.round(
                  ((hitCount - minHitCount) / (maxHitCount - minHitCount)) * NUM_GRADIENT_COLORS
                )
              );
            }
            hitCountClassName = styles[`LineHitCount${hitCountIndex + 1}`];
          }

          const linePoint = points.find(
            point => point.location.sourceId === sourceId && point.location.line === lineNumber
          );

          let hoverButton = null;
          let lineSegments = null;
          if (linePoint) {
            hoverButton = (
              <button className={styles.Button} onClick={() => deletePoints(linePoint.id)}>
                <Icon className={styles.Icon} type="remove" />
              </button>
            );
            lineSegments = (
              <>
                <pre className={styles.LineSegment}>
                  {line.substring(0, linePoint.location.column)}
                </pre>
                <button
                  className={styles.BreakpointButton}
                  onClick={() => editPoint(linePoint.id, { shouldBreak: !linePoint.shouldBreak })}
                >
                  <Icon
                    className={
                      linePoint.shouldBreak ? styles.BreakpointIcon : styles.DisabledBreakpointIcon
                    }
                    type="breakpoint"
                  />
                </button>
                <pre className={styles.LineSegment}>
                  {line.substring(linePoint.location.column)}
                </pre>
              </>
            );
          } else {
            hoverButton = (
              <>
                <button className={styles.Button} onClick={() => onAddPointButtonClick(lineNumber)}>
                  <Icon className={styles.Icon} type="add" />
                </button>
              </>
            );
            lineSegments = <pre className={styles.LineSegment}>{line}</pre>;
          }

          return (
            <Fragment key={index}>
              <div
                key={index}
                className={lineHasHits ? styles.LineWithHits : styles.LineWithoutHits}
                data-test-id={`SourceLine-${lineNumber}`}
              >
                <div className={styles.LineNumber}>{lineNumber}</div>
                {hoverButton}
                <div className={hitCountClassName} />
                {lineSegments}
              </div>
              {linePoint && <PointPanel className={styles.PointPanel} point={linePoint} />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
