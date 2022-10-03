import Icon from "@bvaughn/components/Icon";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getSourceContents, getSourceHitCounts } from "@bvaughn/src/suspense/SourcesCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
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

  const { addPoint, deletePoint, points } = useContext(PointsContext);

  const fileName = getSourceFileName(source) || "unknown";

  const [hitCounts, sourceContents] = suspendInParallel(
    () => getSourceHitCounts(client, sourceId),
    () => getSourceContents(client, sourceId)
  );

  // Min/max hit counts are used to determine heat map color.
  const { minHitCount, maxHitCount } = useMemo(() => {
    let minHitCount = Infinity;
    let maxHitCount = 0;
    if (hitCounts) {
      hitCounts.forEach(hitCount => {
        const hits = hitCount.columnHits?.[0].hits || 0;
        if (hits > 0) {
          if (minHitCount > hits) {
            minHitCount = hits;
          }
          if (maxHitCount < hits) {
            maxHitCount = hits;
          }
        }
      });
    }
    return { minHitCount, maxHitCount };
  }, [hitCounts]);

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
        {sourceContents.contents.split("\n").map((line, index) => {
          const lineNumber = index + 1;
          const lineHasHits = hitCounts.has(lineNumber);
          const hitCount = hitCounts?.get(lineNumber)?.columnHits?.[0].hits || 0;

          // We use a gradient to indicate the "heat" (the number of hits).
          // This absolute hit count values are relative, per file.
          // Cubed root prevents high hit counts from lumping all other values together.
          const NUM_GRADIENT_COLORS = 3;
          let hitCountClassName = styles.LineHitCount0;
          let hitCountIndex = NUM_GRADIENT_COLORS - 1;
          if (hitCount > 0) {
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
              <button className={styles.Button} onClick={() => deletePoint(linePoint.id)}>
                <Icon className={styles.Icon} type="remove" />
              </button>
            );
            lineSegments = (
              <>
                <pre className={styles.LineSegment}>
                  {line.substring(0, linePoint.location.column)}
                </pre>
                <Icon className={styles.BreakpointIcon} type="breakpoint" />
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
