import React, { useContext, useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";
import { useImperativeCacheValue } from "suspense";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";
import { useAppSelector } from "ui/setup/hooks";
import { processedNodeDataCache } from "ui/suspense/nodeCaches";

import { HTMLBreadcrumbs } from "./HTMLBreadcrumbs";
import { InspectorSearch } from "./InspectorSearch";
import { MarkupContext, MarkupContextValue } from "./MarkupContext";
import Nodes from "./Nodes";

// TODO [FE-1855] Delete this component and its children once the new ElementsPanel has shipped
function MarkupApp() {
  const replayClient = useContext(ReplayClientContext);
  const markupContextValue: MarkupContextValue = useAppSelector(
    state => ({
      loadingFailed: state.markup.loadingFailed,
      rootNodeId: state.markup.rootNode,
      pauseId: getPauseId(state),
    }),
    shallowEqual
  );
  const { rootNodeId, pauseId, loadingFailed } = markupContextValue;
  const { value: markupRootNode, status } = useImperativeCacheValue(
    processedNodeDataCache,
    replayClient,
    pauseId!,
    rootNodeId!
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const searchBoxShortcutsRef = useRef<KeyShortcuts | null>(null);

  useEffect(() => {
    searchBoxShortcutsRef.current = new KeyShortcuts({
      window: document.defaultView,
      target: contentRef.current,
    });

    const key = "CmdOrCtrl+F";
    const listener = (event: KeyboardEvent) => {
      event.preventDefault();
      const searchBoxInput =
        contentRef.current?.querySelector<HTMLInputElement>("#inspector-searchbox");

      searchBoxInput?.focus();
    };

    searchBoxShortcutsRef.current.on(key, listener);

    return () => {
      searchBoxShortcutsRef.current?.off(key, listener);
    };
  }, []);

  const isMarkupEmpty = status !== "resolved" || (markupRootNode?.children?.length || 0) == 0;
  const showLoadingProgressBar = isMarkupEmpty && !loadingFailed;
  const showLoadingFailedMessage = loadingFailed;

  return (
    <div className="devtools-inspector-tab-panel">
      <div id="inspector-main-content" className="devtools-main-content" ref={contentRef}>
        <div id="inspector-toolbar" className="devtools-toolbar devtools-input-toolbar">
          <InspectorSearch />
          <div className="devtools-separator" hidden={true}></div>
          <button
            id="inspector-element-add-button"
            className="devtools-button"
            data-localization="title=inspectorAddNode.label"
            hidden={true}
          ></button>
          <button
            id="inspector-eyedropper-toggle"
            className="devtools-button"
            hidden={true}
          ></button>
        </div>
        <div id="markup-box" className="devtools-monospace bg-bodyBgcolor">
          <div id="markup-root-wrapper" role="presentation">
            <div id="markup-root" role="presentation">
              <MarkupContext.Provider value={markupContextValue}>
                {<Nodes key={pauseId} />}
              </MarkupContext.Provider>
            </div>
          </div>
          {showLoadingProgressBar && <LoadingProgressBar />}
          {showLoadingFailedMessage && (
            <div className="devtools-sidepanel-no-result">Elements are not available</div>
          )}
        </div>
        <HTMLBreadcrumbs />
      </div>
    </div>
  );
}

export default React.memo(MarkupApp);
