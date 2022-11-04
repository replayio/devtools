import "bvaughn-architecture-demo/components/sources/CodeMirror.css";
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
  const { focusedSourceId, openSource, openSourceIds, visibleLines } = useContext(SourcesContext);
  const [sourceSearchState, sourceSearchActions] = useContext(SourceSearchContext);

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

    openSource(location.sourceId, lineNumber > 0 ? lineNumber : undefined);
  }, [location, openSource]);

  // Sync the lines currently rendered by the new Source list to Redux.
  // This updates Redux state to mark certain actions as "processed".
  useEffect(() => {
    if (visibleLines) {
      dispatch(setViewport(visibleLines));
    }
  }, [dispatch, visibleLines]);

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
