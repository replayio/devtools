import { getSourceContents } from "@bvaughn/src/suspense/SourcesCache";
import { highlight } from "@bvaughn/src/suspense/TokenizerCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { newSource as ProtocolSource, SourceId as ProtocolSourceId } from "@replayio/protocol";
import { useContext, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import PreviewPopup from "./PreviewPopup";
import styles from "./Source.module.css";
import SourceList from "./SourceList";

export type HoveredState = {
  expression: string;
  target: HTMLElement;
};

export default function Source({
  source,
  sourceId,
}: {
  source: ProtocolSource;
  sourceId: ProtocolSourceId;
}) {
  const client = useContext(ReplayClientContext);

  const [hoveredState, setHoveredState] = useState<HoveredState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fileName = getSourceFileName(source, true) || "unknown";

  const sourceContents = getSourceContents(client, sourceId);

  // TODO Incrementally parse code using SourceContext -> visibleLines
  const code = sourceContents.contents;
  const htmlLines = highlight(code, fileName);
  if (htmlLines === null) {
    return null;
  }

  // TODO Add CMD+F code search

  return (
    <div className={styles.Source} data-test-id={`Source-${fileName}`} ref={containerRef}>
      <div className={styles.SourceList}>
        <AutoSizer>
          {({ height, width }) => (
            <SourceList
              height={height}
              htmlLines={htmlLines}
              setHoveredState={setHoveredState}
              source={source}
              sourceId={sourceId}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
      {hoveredState ? (
        <PreviewPopup
          containerRef={containerRef}
          dismiss={() => setHoveredState(null)}
          expression={hoveredState.expression}
          target={hoveredState.target}
        />
      ) : null}
    </div>
  );
}
