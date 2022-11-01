import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { getSource } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { getSourceFileName } from "bvaughn-architecture-demo/src/utils/source";
import { KeyboardEvent, MouseEvent, useContext, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import Icon from "../Icon";
import LazyOffscreen from "../LazyOffscreen";

import Source from "./Source";
import styles from "./Sources.module.css";
import {
  SourceFileNameSearchContext,
  SourceFileNameSearchContextRoot,
} from "./SourceFileNameSearchContext";
import { SourceSearchContext, SourceSearchContextRoot } from "./SourceSearchContext";
import SourceSearch from "./SourceSearch";
import SourceFileNameSearch from "./SourceFileNameSearch";

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
  const { closeSource, focusedSourceId, openSource, openSourceIds } = useContext(SourcesContext);
  const client = useContext(ReplayClientContext);

  const containerRef = useRef<HTMLDivElement>(null);
  const sourceFileNameSearchInputRef = useRef<HTMLInputElement>(null);
  const sourceSearchInputRef = useRef<HTMLInputElement>(null);

  const [sourceFileNameSearchState, sourceFileNameSearchActions] = useContext(
    SourceFileNameSearchContext
  );
  const [sourceSearchState, sourceSearchActions] = useContext(SourceSearchContext);

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
      case "o":
      case "O":
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
          {openSourceIds.map(sourceId => {
            const source = getSource(client, sourceId);
            const fileName = (source && getSourceFileName(source, true)) || "unknown";

            const onOpenButtonClick = (event: MouseEvent) => {
              event.preventDefault();
              event.stopPropagation();

              openSource(sourceId);
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
          {openSourceIds.length === 0 && <div className={styles.NoOpenSources}>Sources</div>}
          {openSourceIds.map(sourceId => {
            const source = getSource(client, sourceId);
            return (
              <LazyOffscreen
                key={sourceId}
                mode={sourceId === focusedSourceId ? "visible" : "hidden"}
              >
                <Source source={source!} showColumnBreakpoints={true} />
              </LazyOffscreen>
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
