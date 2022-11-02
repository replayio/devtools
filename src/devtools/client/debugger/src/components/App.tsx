/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, useRef } from "react";
import { ConnectedProps, connect } from "react-redux";

import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { setUnexpectedError } from "ui/actions/errors";
import { useGetUserSettings } from "ui/hooks/settings";
import { getSelectedPanel } from "ui/reducers/layout";
import type { UIState } from "ui/state";

import actions from "../actions";
import A11yIntention from "./A11yIntention";
import { EditorPane } from "./Editor/EditorPane";
import ShortcutsContext from "./Editor/ShortcutsContext";

const mapStateToProps = (state: UIState) => ({
  selectedPanel: getSelectedPanel(state),
});

const connector = connect(mapStateToProps, {
  refreshCodeMirror: actions.refreshCodeMirror,
  setUnexpectedError,
});

type PropsFromRedux = ConnectedProps<typeof connector>;
type DebuggerProps = PropsFromRedux & { wrapper: HTMLDivElement };

class Debugger extends Component<DebuggerProps> {
  shortcuts = new KeyShortcuts({ window, target: this.props.wrapper });

  componentDidMount() {
    this.props.refreshCodeMirror();
  }

  componentDidUpdate(prevProps: DebuggerProps) {
    const { selectedPanel, refreshCodeMirror } = this.props;

    // Only refresh CodeMirror when moving from a non-debugger panel to the debugger panel. Otherwise,
    // the gutter will keep errantly resizing between refreshes.
    if (selectedPanel == "debugger" && prevProps.selectedPanel != selectedPanel) {
      refreshCodeMirror();
    }
  }

  // Important so that the tabs chevron updates appropriately when
  // the user resizes the left or right columns
  triggerEditorPaneResize() {
    const editorPane = window.document.querySelector(".editor-pane");
    if (editorPane) {
      editorPane.dispatchEvent(new Event("resizeend"));
    }
  }

  render() {
    return (
      <ShortcutsContext.Provider value={this.shortcuts}>
        <>
          <A11yIntention>
            <EditorPane />
          </A11yIntention>
        </>
      </ShortcutsContext.Provider>
    );
  }
}

function DebuggerLoader(props: any) {
  const wrapperNode = useRef<HTMLDivElement>(null);
  const { loading: loadingSettings } = useGetUserSettings();
  return (
    <div className="debugger" ref={wrapperNode}>
      {loadingSettings ? null : <Debugger {...props} wrapper={wrapperNode.current} />}
    </div>
  );
}

export default connector(DebuggerLoader);
