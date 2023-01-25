import React, { Suspense, useEffect, useRef } from "react";
import { ConnectedProps, connect } from "react-redux";

import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import LoadingProgressBar from "ui/components/shared/LoadingProgressBar";
import { UIState } from "ui/state";

import { getNodeInfo } from "../selectors/markup";
import { HTMLBreadcrumbs } from "./HTMLBreadcrumbs";
import { InspectorSearch } from "./InspectorSearch";
import Nodes from "./Nodes";

export interface MarkupProps {}

type PropsFromParent = {};

function MarkupApp({ loadingFailed, markupRootNode }: PropsFromRedux & PropsFromParent) {
  const isMarkupEmpty = (markupRootNode?.children?.length || 0) == 0;

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
              {<Nodes />}
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

const connector = connect((state: UIState) => ({
  loadingFailed: state.markup.loadingFailed,
  markupRootNode: getNodeInfo(state, state.markup.rootNode!),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MarkupApp);
