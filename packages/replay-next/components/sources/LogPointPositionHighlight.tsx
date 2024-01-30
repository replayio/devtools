import { SameLineSourceLocations } from "@replayio/protocol";

import Icon from "replay-next/components/Icon";

import styles from "./LogPointPositionHighlight.module.css";

export function LogPointPositionHighlight({
  breakablePositionsByLine,
  lineNumber,
  lineText,
}: {
  breakablePositionsByLine: Map<number, SameLineSourceLocations>;
  lineNumber: number;
  lineText: string;
}) {
  const positions = breakablePositionsByLine.get(lineNumber);
  if (positions == null || positions.columns.length === 0) {
    return null;
  }

  const indexStart = positions.columns[0];
  const indexStop = positions.columns[1] ?? lineText.length;

  // return (
  //   <div
  //     className={styles.DownArrow}
  //     style={{
  //       // @ts-ignore
  //       "--data-column-offset": `${indexStart}ch`,
  //       // @ts-ignore
  //       "--data-width": `${indexStop - indexStart}ch`,
  //     }}
  //     type="down"
  //   />
  // );
  return (
    <div
      className={styles.Highlight}
      style={{
        // @ts-ignore
        "--data-column-offset": `${indexStart}ch`,
        // @ts-ignore
        "--data-width": `${indexStop - indexStart}ch`,
      }}
    >
      {lineText.substring(indexStart, indexStop)}
    </div>
  );
}
