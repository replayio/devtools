import Loader from "@bvaughn/components/Loader";
import { SourcesContext } from "@bvaughn/src/contexts/SourcesContext";
import { getSource } from "@bvaughn/src/suspense/SourcesCache";
import { getSourceFileName } from "@bvaughn/src/utils/source";
import { Suspense, useContext, useEffect, useRef } from "react";
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

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const onBodyKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case "Escape":
            sourceSearchActions.hide();
            sourceFileNameSearchActions.hide();

            const container = containerRef.current;
            if (container) {
              container.focus();
            }

            event.preventDefault();
            event.stopPropagation();
            break;
          case "o":
          case "O":
            if (event.metaKey) {
              sourceFileNameSearchActions.show();

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

      const onContainerKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case "Escape":
            sourceSearchActions.hide();
            sourceFileNameSearchActions.hide();

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
              sourceSearchActions.show();

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

      container.addEventListener("keydown", onContainerKeyDown);
      document.body.addEventListener("keydown", onBodyKeyDown);

      return () => {
        container.removeEventListener("keydown", onContainerKeyDown);
        document.body.removeEventListener("keydown", onBodyKeyDown);
      };
    }
  }, [sourceFileNameSearchActions, sourceSearchActions]);

  return (
    <>
      <div className={styles.Sources} data-test-id="SourcesRoot" ref={containerRef} tabIndex={0}>
        <div className={styles.Tabs}>
          {openSourceIds.map(sourceId => {
            const source = getSource(client, sourceId);
            const fileName = (source && getSourceFileName(source, true)) || "unknown";
            return (
              <div
                key={sourceId}
                className={sourceId === focusedSourceId ? styles.SelectedTab : styles.Tab}
                data-test-id={`SourceTab-${sourceId}`}
              >
                <button className={styles.OpenButton} onClick={() => openSource(sourceId)}>
                  {fileName}
                </button>
                <button className={styles.CloseButton} onClick={() => closeSource(sourceId)}>
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
                <Suspense fallback={<Loader />}>
                  <Source source={source!} />
                </Suspense>
              </LazyOffscreen>
            );
          })}
        </div>
        {sourceFileNameSearchState.visible && (
          <SourceFileNameSearch inputRef={sourceFileNameSearchInputRef} />
        )}
      </div>
      {sourceSearchState.visible && <SourceSearch inputRef={sourceSearchInputRef} />}
    </>
  );
}
