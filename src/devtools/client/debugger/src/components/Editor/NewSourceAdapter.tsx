import { KeyboardEvent, useContext, useEffect, useLayoutEffect, useRef } from "react";

import LazyOffscreen from "bvaughn-architecture-demo/components/LazyOffscreen";
import Source from "bvaughn-architecture-demo/components/sources/Source";
import { SourceFileNameSearchContextRoot } from "bvaughn-architecture-demo/components/sources/SourceFileNameSearchContext";
import SourceSearch from "bvaughn-architecture-demo/components/sources/SourceSearch";
import {
  SourceSearchContext,
  SourceSearchContextRoot,
} from "bvaughn-architecture-demo/components/sources/SourceSearchContext";
import { KeyboardModifiersContextRoot } from "bvaughn-architecture-demo/src/contexts/KeyboardModifiersContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getSource } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useFeature } from "ui/hooks/settings";
import { getSelectedLocation } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { setViewport } from "../../selectors";
import NewSourceNag from "./NewSourceNag";
import "bvaughn-architecture-demo/components/sources/CodeMirror.css";

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
  const { focusedSource, openSource, openSourceIds, visibleLines } = useContext(SourcesContext);
  const [sourceSearchState, sourceSearchActions] = useContext(SourceSearchContext);

  const focusedSourceId = focusedSource?.sourceId ?? null;

  const sourceSearchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { value: showColumnBreakpoints } = useFeature("columnBreakpoints");

  const dispatch = useAppDispatch();
  const location = useAppSelector(getSelectedLocation);

  // Sync the selected location that's in Redux to the new SourcesContext.
  // This makes the CMD+O and CMD+G menus work.
  // This also makes clicking on Console log locations work.
  useLayoutEffect(() => {
    if (location == null) {
      return;
    }

    // TRICKY
    // Legacy code passes 1-based line numbers around,
    // Except when a filed is opened (e.g. by clicking on the file tab) in which cases it passes 0.
    // We ignore the 0 because it breaks scroll state preservation between tabs.
    const lineNumber = location?.line ?? 0;
    const lineIndex = lineNumber > 0 ? lineNumber - 1 : undefined;

    // Sync focused state from Redux to React context,
    if (
      focusedSource?.sourceId !== location.sourceId ||
      focusedSource?.startLineIndex !== lineIndex
    ) {
      openSource("view-source", location.sourceId, lineIndex, lineIndex);
    }
  }, [focusedSource, location, openSource]);

  // Sync the lines currently rendered by the new Source list to Redux.
  // This updates Redux state to mark certain actions as "processed".
  useEffect(() => {
    if (visibleLines) {
      dispatch(setViewport(visibleLines));
    }
  }, [dispatch, visibleLines]);

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key.toLowerCase()) {
      case "f": {
        if (event.shiftKey) {
          // Cmd+Shift+F is reserved global search.
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          sourceSearchActions.enable();

          const input = sourceSearchInputRef.current;
          if (input) {
            input.focus();
            input.select();
          }

          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
      case "g": {
        if (event.ctrlKey || event.metaKey) {
          // Unlike Enter / Shift+Enter, this event handler is external to the Search input
          // so that we can mirror UIs like Chrome and Code and re-open the search UI if it's been closed
          sourceSearchActions.enable();
          if (event.shiftKey) {
            sourceSearchActions.goToPrevious();
          } else {
            sourceSearchActions.goToNext();
          }

          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
    }
  };

  return (
    <div
      className="editor-wrapper relative flex flex-col outline-none"
      onKeyDown={onKeyDown}
      ref={containerRef}
      tabIndex={0}
    >
      <NewSourceNag />
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
