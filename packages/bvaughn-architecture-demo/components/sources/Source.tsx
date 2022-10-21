import { getSourceContents } from "@bvaughn/src/suspense/SourcesCache";
import { parse } from "@bvaughn/src/suspense/SyntaxParsingCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { newSource as ProtocolSource } from "@replayio/protocol";
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

export default function Source({ source }: { source: ProtocolSource }) {
  const [hoveredState, setHoveredState] = useState<HoveredState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fileName = getSourceFileName(source, true) || "unknown";

  const client = useContext(ReplayClientContext);
  const sourceContents = getSourceContents(client, source.sourceId);

  // TODO Incrementally parse code using SourceContext -> visibleLines
  const code = sourceContents.contents;
  const htmlLines = parse(code, fileName);
  if (htmlLines === null) {
    return null;
  }

  return (
    <div
      className={styles.Source}
      data-test-id={`Source-${source.sourceId}`}
      data-test-name="Source"
      ref={containerRef}
    >
      <div className={styles.SourceList}>
        <AutoSizer>
          {({ height, width }) => (
            <SourceList
              height={height}
              htmlLines={htmlLines}
              setHoveredState={setHoveredState}
              source={source}
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
