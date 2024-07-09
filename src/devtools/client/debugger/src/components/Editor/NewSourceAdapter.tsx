import { KeyboardEvent, useContext, useEffect, useLayoutEffect, useRef } from "react";

import LazyActivity from "replay-next/components/LazyActivity";
import Source from "replay-next/components/sources/Source";
import { SourceFileNameSearchContextRoot } from "replay-next/components/sources/SourceFileNameSearchContext";
import SourceSearch from "replay-next/components/sources/SourceSearch";
import {
  SourceSearchContext,
  SourceSearchContextRoot,
} from "replay-next/components/sources/SourceSearchContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getSourceSuspends } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isMacOS } from "shared/utils/os";
import { getSelectedLocation, getSelectedLocationHasScrolled } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { getTabs, setViewport } from "../../selectors";
import NewSourceNag from "./NewSourceNag";
import "replay-next/components/sources/CodeMirror.css";

export default function NewSourceAdapterRoot() {
  return (
    <SourceFileNameSearchContextRoot>
      <SourceSearchContextRoot>
        <NewSourceAdapter />
      </SourceSearchContextRoot>
    </SourceFileNameSearchContextRoot>
  );
}

function NewSourceAdapter() {
  const replayClient = useContext(ReplayClientContext);
  const { closeSource, focusedSource, openSource, activeSourceIds, visibleLines } =
    useContext(SourcesContext);
  const [sourceSearchState, sourceSearchActions] = useContext(SourceSearchContext);

  const focusedSourceId = focusedSource?.sourceId ?? null;

  const sourceSearchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const location = useAppSelector(getSelectedLocation);
  const locationHasScrolled = useAppSelector(getSelectedLocationHasScrolled);
  const tabs = useAppSelector(getTabs);

  // Sync the selected location that's in Redux to the new SourcesContext.
  // This makes the CMD+O and CMD+G menus work.
  // This also makes clicking on Console log locations work.
  useLayoutEffect(() => {
    if (location == null) {
      return;
    }

    // TRICKY
    // Legacy code passes 1-based line numbers around,
    // Except when a file is opened (e.g. by clicking on the file tab) in which cases it passes 0.
    // We ignore the 0 because it breaks scroll state preservation between tabs.
    const lineNumber = location?.line ?? 0;
    const lineIndex = lineNumber > 0 ? lineNumber - 1 : undefined;

    const columnNumber = location?.column ?? 1;

    // Sync focused state from Redux to React context,
    if (
      focusedSource?.sourceId !== location.sourceId ||
      focusedSource?.startLineIndex !== lineIndex ||
      !locationHasScrolled
    ) {
      openSource("view-source", location.sourceId, lineIndex, lineIndex, columnNumber, false);
    }
  }, [focusedSource, location, locationHasScrolled, openSource]);

  useLayoutEffect(() => {
    activeSourceIds.forEach(sourceId => {
      const openTab = tabs.find(tab => tab.sourceId === sourceId);
      if (!openTab) {
        closeSource(sourceId);
      }
    });
  }, [closeSource, activeSourceIds, tabs]);

  // Sync the lines currently rendered by the new Source list to Redux.
  // This updates Redux state to mark certain actions as "processed".
  useEffect(() => {
    if (visibleLines) {
      dispatch(setViewport(visibleLines));
    }
  }, [dispatch, visibleLines]);

  useEffect(() => {
    if (focusedSourceId != null && containerRef.current) {
      // Focus source viewer whenever we load or switch a source so that CMD+F for "search" works right
      containerRef.current.focus();
    }
  }, [focusedSourceId]);

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
        // CMD+G should continue an in-progress search
        // CTRL+G is for go-to-line though
        if (isMacOS() ? event.metaKey : event.ctrlKey) {
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
      {activeSourceIds.map(sourceId => {
        const source = getSourceSuspends(replayClient, sourceId);
        return (
          <LazyActivity key={sourceId} mode={sourceId === focusedSourceId ? "visible" : "hidden"}>
            <Source source={source!} />
          </LazyActivity>
        );
      })}
      {sourceSearchState.enabled && (
        <SourceSearch containerRef={containerRef} inputRef={sourceSearchInputRef} />
      )}
    </div>
  );
}
