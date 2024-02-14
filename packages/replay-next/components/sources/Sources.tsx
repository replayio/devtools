import { KeyboardEvent, MouseEvent, useContext, useRef } from "react";

import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { getSourceSuspends } from "replay-next/src/suspense/SourcesCache";
import { getSourceFileName } from "replay-next/src/utils/source";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Icon from "../Icon";
import LazyActivity from "../LazyActivity";
import Source from "./Source";
import SourceFileNameSearch from "./SourceFileNameSearch";
import {
  SourceFileNameSearchContext,
  SourceFileNameSearchContextRoot,
} from "./SourceFileNameSearchContext";
import SourceSearch from "./SourceSearch";
import { SourceSearchContext, SourceSearchContextRoot } from "./SourceSearchContext";
import styles from "./Sources.module.css";

export default function SourcesRoot() {
  return (
    <SourceFileNameSearchContextRoot>
      <SourceSearchContextRoot>
        <Sources />
      </SourceSearchContextRoot>
    </SourceFileNameSearchContextRoot>
  );
}

function Sources() {
  const client = useContext(ReplayClientContext);
  const { closeSource, focusedSource, openSource, activeSourceIds } = useContext(SourcesContext);
  const focusedSourceId = focusedSource?.sourceId ?? null;

  const containerRef = useRef<HTMLDivElement>(null);
  const sourceFileNameSearchInputRef = useRef<HTMLInputElement>(null);
  const sourceSearchInputRef = useRef<HTMLInputElement>(null);

  const [sourceFileNameSearchState, sourceFileNameSearchActions] = useContext(
    SourceFileNameSearchContext
  );
  const [sourceSearchState, sourceSearchActions] = useContext(SourceSearchContext);

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
      case "o": {
        if (event.ctrlKey || event.metaKey) {
          sourceFileNameSearchActions.enable();

          const input = sourceFileNameSearchInputRef.current;
          if (input) {
            input.focus();
          }

          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
    }
  };

  return (
    <>
      <div
        className={styles.Sources}
        data-test-id="SourcesRoot"
        onKeyDown={onKeyDown}
        ref={containerRef}
        tabIndex={0}
      >
        <div className={styles.Tabs}>
          {activeSourceIds.map(sourceId => {
            const source = getSourceSuspends(client, sourceId);
            const fileName = (source && getSourceFileName(source, true)) || "unknown";

            const onOpenButtonClick = (event: MouseEvent) => {
              event.preventDefault();
              event.stopPropagation();

              openSource("view-source", sourceId);
            };

            const onCloseButtonClick = (event: MouseEvent) => {
              event.preventDefault();
              event.stopPropagation();

              closeSource(sourceId);
            };

            return (
              <div
                key={sourceId}
                className={sourceId === focusedSourceId ? styles.SelectedTab : styles.Tab}
                data-test-id={`SourceTab-${sourceId}`}
                data-test-state={sourceId === focusedSourceId ? "selected" : "unselected"}
                onClick={onOpenButtonClick}
              >
                <button className={styles.OpenButton} onClick={onOpenButtonClick}>
                  {fileName}
                </button>
                <button className={styles.CloseButton} onClick={onCloseButtonClick}>
                  <Icon className={styles.Icon} type="close" />
                </button>
              </div>
            );
          })}
        </div>
        <div className={styles.Content}>
          {activeSourceIds.length === 0 && <div className={styles.NoOpenSources}>Sources</div>}
          {activeSourceIds.map(sourceId => {
            const source = getSourceSuspends(client, sourceId);
            return (
              <LazyActivity
                key={sourceId}
                mode={sourceId === focusedSourceId ? "visible" : "hidden"}
              >
                <Source source={source!} />
              </LazyActivity>
            );
          })}
        </div>
        {sourceFileNameSearchState.enabled && (
          <SourceFileNameSearch
            containerRef={containerRef}
            inputRef={sourceFileNameSearchInputRef}
          />
        )}
        {sourceSearchState.enabled && (
          <SourceSearch containerRef={containerRef} inputRef={sourceSearchInputRef} />
        )}
      </div>
    </>
  );
}
