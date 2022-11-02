import React, { Suspense, useEffect, useRef } from "react";
import { ConnectedProps, connect } from "react-redux";

import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { UIState } from "ui/state";

import { getNodeInfo } from "../selectors/markup";
import { HTMLBreadcrumbs } from "./HTMLBreadcrumbs";
import { InspectorSearch } from "./InspectorSearch";
import Nodes from "./Nodes";

const LoadingProgressBar = require("ui/components/shared/LoadingProgressBar").default;

export interface MarkupProps {}

type PropsFromParent = {};

function MarkupApp({ markupRootNode }: PropsFromRedux & PropsFromParent) {
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
          {isMarkupEmpty ? <LoadingProgressBar /> : null}
        </div>
        <HTMLBreadcrumbs />
      </div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  markupRootNode: getNodeInfo(state, state.markup.rootNode!),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MarkupApp);
