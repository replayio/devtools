import Icon from "@bvaughn/components/Icon";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getSourceContents, gitSourceHitCounts } from "@bvaughn/src/suspense/SourcesCache";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { newSource as ProtocolSource, SourceId as ProtocolSourceId } from "@replayio/protocol";
import { ChangeEvent, useContext, useState } from "react";
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

  const [lineNumber, setLineNumber] = useState(1);

  const { addPoint, points } = useContext(PointsContext);

  const [sourceHitCounts, sourceContents] = suspendInParallel(
    () => gitSourceHitCounts(client, sourceId),
    () => getSourceContents(client, sourceId)
  );

  const numLines = sourceContents.contents.split("\n").length;
  const lineHasHits = sourceHitCounts.has(lineNumber);

  const onLineNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(numLines, parseInt(event.currentTarget.value, 10))) || 1;

    setLineNumber(value);
  };

  const onAddPointButtonClick = () => {
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
      <div className={styles.Header}>
        <button
          className={styles.AddButton}
          disabled={!lineHasHits}
          onClick={onAddPointButtonClick}
        >
          <Icon className={styles.AddButtonIcon} type="add" />
          Add point
        </button>
        to line
        <input
          className={styles.LineNumberInput}
          onChange={onLineNumberChange}
          size={3}
          type="number"
          value={lineNumber}
        />
      </div>

      {points
        .filter(point => point.location.sourceId === sourceId)
        .map(point => (
          <PointPanel key={point.id} point={point} />
        ))}
    </div>
  );
}
