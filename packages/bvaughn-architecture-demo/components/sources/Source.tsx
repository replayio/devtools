import Icon from "@bvaughn/components/Icon";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getSourceContents } from "@bvaughn/src/suspense/SourcesCache";
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
  const [lineNumber, setLineNumber] = useState(0);

  const { addPoint, points } = useContext(PointsContext);

  const sourceContents = getSourceContents(client, sourceId);
  const numLines = sourceContents.contents.split("\n").length;

  const onLineNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(numLines, parseInt(event.currentTarget.value, 10))) || 0;
    setLineNumber(value);
  };

  const onAddPointButtonClick = () => {
    addPoint(null, {
      columnNumber: 0,
      lineNumber,
      sourceId,
    });
  };

  return (
    <div className={styles.Source}>
      <div className={styles.Header}>
        <button className={styles.AddButton} onClick={onAddPointButtonClick}>
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
        .filter(point => point.sourceId === sourceId)
        .map(point => (
          <PointPanel key={point.id} point={point} />
        ))}
    </div>
  );
}
