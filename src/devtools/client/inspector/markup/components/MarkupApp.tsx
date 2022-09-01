import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import MarkupSearchbox from "../searchbox";
import Nodes from "./Nodes";
import { getNodeInfo } from "../selectors/markup";
const LoadingProgressBar = require("ui/components/shared/LoadingProgressBar").default;
import { HTMLBreadcrumbs } from "./HTMLBreadcrumbs";
import { getIsPaused } from "devtools/client/debugger/src/reducers/pause";

export interface MarkupProps {}

function setupLegacyComponents() {
  const searchbox = new MarkupSearchbox();
  searchbox.setupSearchBox();
}

type PropsFromParent = {};

function MarkupApp({ markupRootNode, isPaused }: PropsFromRedux & PropsFromParent) {
  const isMarkupEmpty = (markupRootNode?.children?.length || 0) == 0;

  useEffect(() => setupLegacyComponents(), []);

  return (
    <div className="devtools-inspector-tab-panel">
      <div id="inspector-main-content" className="devtools-main-content">
        <div id="inspector-toolbar" className="devtools-toolbar devtools-input-toolbar">
          <div id="inspector-search" className="devtools-searchbox text-themeTextFieldColor">
            <input
              id="inspector-searchbox"
              className="devtools-searchinput"
              type="input"
              placeholder="Search HTML"
              autoComplete="off"
            />
          </div>
          <div id="inspector-searchlabel-container" hidden={true}>
            <div
              className="devtools-separator"
              style={{ height: "calc(var(--theme-toolbar-height) - 8px" }}
            ></div>
            <span id="inspector-searchlabel" className="whitespace-nowrap"></span>
          </div>
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
          {isPaused && isMarkupEmpty ? <LoadingProgressBar /> : null}
        </div>
        <HTMLBreadcrumbs />
      </div>
    </div>
  );
}

const connector = connect((state: UIState) => ({
  markupRootNode: getNodeInfo(state, state.markup.rootNode!),
  isPaused: getIsPaused(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MarkupApp);
