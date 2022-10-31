import "@bvaughn/components/sources/CodeMirror.css";
import { SourceFileNameSearchContextRoot } from "@bvaughn/components/sources/SourceFileNameSearchContext";
import SourceSearch from "@bvaughn/components/sources/SourceSearch";
import {
  SourceSearchContext,
  SourceSearchContextRoot,
} from "@bvaughn/components/sources/SourceSearchContext";
import { KeyboardModifiersContextRoot } from "@bvaughn/src/contexts/KeyboardModifiersContext";
import LazyOffscreen from "@bvaughn/components/LazyOffscreen";
import Source from "@bvaughn/components/sources/Source";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSource } from "@bvaughn/src/suspense/SourcesCache";
import { KeyboardEvent, useContext, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useFeature } from "ui/hooks/settings";

export default function NewSourceAdapterRoot() {
  return (
    <KeyboardModifiersContextRoot>
      <SourceFileNameSearchContextRoot>
        <SourceSearchContextRoot>
          <NewSourceAdapter />
        </SourceSearchContextRoot>
      </SourceFileNameSearchContextRoot>
    </KeyboardModifiersContextRoot>
  );
}

function NewSourceAdapter() {
  const replayClient = useContext(ReplayClientContext);
  const { focusedSourceId, openSourceIds } = useContext(SourcesContext);
  const [sourceSearchState, sourceSearchActions] = useContext(SourceSearchContext);

  const sourceSearchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { value: showColumnBreakpoints } = useFeature("columnBreakpoints");

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "f":
      case "F":
        if (event.ctrlKey || event.metaKey) {
          sourceSearchActions.enable();

          const input = sourceSearchInputRef.current;
          if (input) {
            input.focus();
          }

          event.preventDefault();
          event.stopPropagation();
        }
        break;
    }
  };

  return (
    <div
      className="editor-wrapper relative flex flex-col outline-none"
      onKeyDown={onKeyDown}
      ref={containerRef}
      tabIndex={0}
    >
      {openSourceIds.map(sourceId => {
        const source = getSource(replayClient, sourceId);
        return (
          <LazyOffscreen key={sourceId} mode={sourceId === focusedSourceId ? "visible" : "hidden"}>
            <Source source={source!} showColumnBreakpoints={showColumnBreakpoints} />
          </LazyOffscreen>
        );
      })}
      {sourceSearchState.enabled && (
        <SourceSearch containerRef={containerRef} inputRef={sourceSearchInputRef} />
      )}
    </div>
  );
}
