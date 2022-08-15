/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";
import actions from "../actions";
import { setUnexpectedError } from "ui/actions/errors";
import A11yIntention from "./A11yIntention";

import { getSelectedPanel } from "ui/reducers/layout";
import { useGetUserSettings } from "ui/hooks/settings";

import KeyShortcuts from "devtools/client/shared/key-shortcuts";

import { EditorPane } from "./Editor/EditorPane";

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

  static childContextTypes = {
    shortcuts: PropTypes.object,
  };

  getChildContext = () => {
    return { shortcuts: this.shortcuts };
  };

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
      <>
        <A11yIntention>
          <EditorPane />
        </A11yIntention>
      </>
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
