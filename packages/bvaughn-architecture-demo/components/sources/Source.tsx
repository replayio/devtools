import Icon from "@bvaughn/components/Icon";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getSourceContents, gitSourceHitCounts } from "@bvaughn/src/suspense/SourcesCache";
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

  const { addPoint, points } = useContext(PointsContext);

  const [sourceHitCounts, sourceContents] = suspendInParallel(
    () => gitSourceHitCounts(client, sourceId),
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
          const linePoints = points.filter(
            point => point.location.sourceId === sourceId && point.location.line === lineNumber
          );

          return (
            <Fragment key={index}>
              <div
                key={index}
                className={lineHasHits ? styles.LineWithHits : styles.LineWithoutHits}
              >
                <div className={styles.LineNumber}>{lineNumber}</div>
                {lineHasHits && (
                  <button
                    className={styles.AddButton}
                    onClick={() => onAddPointButtonClick(lineNumber)}
                  >
                    <Icon className={styles.AddButtonIcon} type="add" />
                  </button>
                )}
                {line}
              </div>
              {linePoints.map(point => (
                <PointPanel key={point.id} className={styles.PointPanel} point={point} />
              ))}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
