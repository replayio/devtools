/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

import { connect } from "../utils/connect";
import { features } from "../utils/prefs";
import { prefs } from "../../../../../ui/utils/prefs";
import actions from "../actions";
import { setUnexpectedError } from "ui/actions/session";
import A11yIntention from "./A11yIntention";
import { ShortcutsModal } from "./ShortcutsModal";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";

import {
  getActiveSearch,
  getOrientation,
  getPaneCollapse,
  getQuickOpenEnabled,
  getSelectedSource,
} from "../selectors";

import { getSelectedPanel } from "ui/reducers/layout";
import { getToolboxLayout } from "ui/reducers/layout";
import { useGetUserSettings } from "ui/hooks/settings";

import KeyShortcuts from "devtools/client/shared/key-shortcuts";

import { EditorPane } from "./Editor/EditorPane";

class Debugger extends Component {
  getChildContext = () => {
    return { shortcuts: this.shortcuts, l10n: L10N };
  };

  constructor(props) {
    super(props);
    this.shortcuts = new KeyShortcuts({ window, target: props.wrapper });
  }

  componentDidMount() {
    this.props.refreshCodeMirror();
  }

  componentDidUpdate(prevProps) {
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

Debugger.childContextTypes = {
  globalShortcuts: PropTypes.object,
  shortcuts: PropTypes.object,
  l10n: PropTypes.object,
};

function DebuggerLoader(props) {
  const wrapperNode = useRef();
  const { loading: loadingSettings } = useGetUserSettings();
  return (
    <div className="debugger" ref={wrapperNode}>
      {loadingSettings ? null : <Debugger {...props} wrapper={wrapperNode.current} />}
    </div>
  );
}

const mapStateToProps = state => ({
  selectedPanel: getSelectedPanel(state),
  selectedSource: getSelectedSource(state),
  toolboxLayout: getToolboxLayout(state),
  startPanelCollapsed: getPaneCollapse(state),
});

export default connect(mapStateToProps, {
  refreshCodeMirror: actions.refreshCodeMirror,
  setUnexpectedError,
})(DebuggerLoader);
