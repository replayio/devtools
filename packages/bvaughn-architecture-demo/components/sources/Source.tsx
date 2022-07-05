import Icon from "@bvaughn/components/Icon";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getSourceContents, getSourceHitCounts } from "@bvaughn/src/suspense/SourcesCache";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { newSource as ProtocolSource, SourceId as ProtocolSourceId } from "@replayio/protocol";
import { ChangeEvent, Fragment, useContext, useState } from "react";
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

  const [sourceHitCounts, sourceContents] = suspendInParallel(
    () => getSourceHitCounts(client, sourceId),
    () => getSourceContents(client, sourceId)
  );

  const onAddPointButtonClick = (lineNumber: number) => {
    const lineHasHits = sourceHitCounts.has(lineNumber);
    if (!lineHasHits) {
      return;
    }

    const hitCountsForLine = sourceHitCounts.get(lineNumber)!;
    const closestColumnNumber = hitCountsForLine.columnHits[0]!.location.column;
    const fileName = source?.url?.split("/")?.pop();

    addPoint(
      {
        content: `"${fileName}", ${lineNumber}`,
        enableLogging: true,
      },
      {
        column: closestColumnNumber,
        line: lineNumber,
        sourceId,
      }
    );
  };

  return (
    <div className={styles.Source}>
      <div className={styles.SourceContents}>
        {sourceContents.contents.split("\n").map((line, index) => {
          const lineNumber = index + 1;
          const lineHasHits = sourceHitCounts.has(lineNumber);
          const lineHits = lineHasHits
            ? sourceHitCounts.get(lineNumber)?.columnHits[0].hits || 0
            : 0;

          const hitCountBadge =
            lineHits === 0 ? 1 : lineHits < 10 ? 1 : lineHits < 20 ? 2 : lineHits < 50 ? 3 : 4;
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
                data-test-id={`SourceLine${lineNumber}`}
              >
                <div className={styles.LineNumber}>{lineNumber}</div>
                {hoverButton}
                <div
                  className={`${styles[`LineHitCount-${hitCountBadge}`]} ${styles.LineHitCount}`}
                />
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
