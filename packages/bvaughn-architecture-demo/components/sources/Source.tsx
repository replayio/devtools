import { getSourceContents, ProtocolSourceContents } from "@bvaughn/src/suspense/SourcesCache";
import { highlight } from "@bvaughn/src/suspense/TokenizerCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { newSource as ProtocolSource } from "@replayio/protocol";
import { KeyboardEvent, useContext, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import PreviewPopup from "./PreviewPopup";
import styles from "./Source.module.css";
import SourceList from "./SourceList";
import SourceSearch from "./SourceSearch";
import { SourceSearchContext, SourceSearchContextRoot } from "./SourceSearchContext";

export type HoveredState = {
  expression: string;
  target: HTMLElement;
};

export default function SourceSuspender({ source }: { source: ProtocolSource }) {
  const client = useContext(ReplayClientContext);
  const sourceContents = getSourceContents(client, source.sourceId);

  return (
    <SourceSearchContextRoot sourceContents={sourceContents}>
      <Source source={source} sourceContents={sourceContents} />
    </SourceSearchContextRoot>
  );
}

function Source({
  source,
  sourceContents,
}: {
  source: ProtocolSource;
  sourceContents: ProtocolSourceContents;
}) {
  const [state, actions] = useContext(SourceSearchContext);

  const [hoveredState, setHoveredState] = useState<HoveredState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fileName = getSourceFileName(source, true) || "unknown";

  // TODO Incrementally parse code using SourceContext -> visibleLines
  const code = sourceContents.contents;
  const htmlLines = highlight(code, fileName);
  if (htmlLines === null) {
    return null;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Escape":
        actions.hide();

        const container = containerRef.current;
        if (container) {
          container.focus();
        }

        event.preventDefault();
        event.stopPropagation();
        break;
      case "f":
      case "F":
        if (event.metaKey) {
          actions.show();

          const searchInput = searchInputRef.current;
          if (searchInput) {
            searchInput.focus();
          }

          event.preventDefault();
          event.stopPropagation();
        }
        break;
    }
  };

  return (
    <div
      className={styles.Source}
      data-test-id={`Source-${fileName}`}
      onKeyDown={onKeyDown}
      ref={containerRef}
      tabIndex={0}
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
      {state.visible && <SourceSearch hideOnEscape={true} inputRef={searchInputRef} />}
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
