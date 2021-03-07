/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import PropTypes from "prop-types";

import { connect } from "../utils/connect";
import { prefs, features } from "../utils/prefs";
import actions from "../actions";
import A11yIntention from "./A11yIntention";
import { ShortcutsModal } from "./ShortcutsModal";

import {
  getSelectedSource,
  getPaneCollapse,
  getActiveSearch,
  getQuickOpenEnabled,
  getOrientation,
} from "../selectors";
import { getSelectedPanel, getSelectedPrimaryPanel } from "ui/reducers/app.ts";

import { KeyShortcuts } from "devtools-modules";
import Services from "devtools-services";
const shortcuts = new KeyShortcuts({ window, target: document });

const { appinfo } = Services;

const isMacOS = appinfo.OS === "Darwin";

import "./variables.css";
import "./App.css";

import "devtools/client/themes/variables.css";
import "devtools/client/themes/webconsole.css";
import "devtools/client/themes/common.css";

// $FlowIgnore
//import "devtools-launchpad/src/components/Root.css";

import "./shared/menu.css";

import SplitBox from "devtools-splitter";
import ProjectSearch from "./ProjectSearch";
import PrimaryPanes from "./PrimaryPanes";
import Editor from "./Editor";
import SecondaryPanes from "./SecondaryPanes";
import WelcomeBox from "./WelcomeBox";
import EditorTabs from "./Editor/Tabs";
import EditorFooter from "./Editor/Footer";
import QuickOpenModal from "./QuickOpenModal";
import Transcript from "ui/components/Transcript";

class Debugger extends Component {
  onLayoutChange;
  getChildContext;
  renderEditorPane;
  renderLayout;
  toggleQuickOpenModal;
  onEscape;
  onCommandSlash;

  state = {
    shortcutsModalEnabled: false,
    startPanelSize: 0,
  };

  getChildContext = () => {
    return { shortcuts, l10n: L10N };
  };

  componentDidMount() {
    shortcuts.on("CmdOrCtrl+Shift+P", this.toggleSourceQuickOpenModal);
    shortcuts.on("CmdOrCtrl+Shift+O", this.toggleSourceQuickOpenModal);
    shortcuts.on("CmdOrCtrl+P", this.toggleSourceQuickOpenModal);
    shortcuts.on("CmdOrCtrl+O", this.toggleProjectFunctionQuickOpenModal);
    shortcuts.on("Ctrl+G", this.toggleLineQuickOpenModal);

    shortcuts.on("Escape", this.onEscape);
    shortcuts.on("Cmd+/", this.onCommandSlash);

    this.props.refreshCodeMirror();
  }

  componentWillUnmount() {
    shortcuts.off("CmdOrCtrl+Shift+P", this.toggleSourceQuickOpenModal);
    shortcuts.off("CmdOrCtrl+Shift+O", this.toggleFunctionQuickOpenModal);
    shortcuts.off("CmdOrCtrl+P", this.toggleSourceQuickOpenModal);
    shortcuts.off("CmdOrCtrl+O", this.toggleProjectFunctionQuickOpenModal);
    shortcuts.off("Ctrl+G", this.toggleLineQuickOpenModal);

    shortcuts.off("Escape", this.onEscape);
  }

  componentDidUpdate(prevProps) {
    const { selectedPanel, refreshCodeMirror } = this.props;

    // Only refresh CodeMirror when moving from a non-debugger panel to the debugger panel. Otherwise,
    // the gutter will keep errantly resizing between refreshes.
    if (selectedPanel == "debugger" && prevProps.selectedPanel != selectedPanel) {
      refreshCodeMirror();
    }
  }

  onEscape = (_, e) => {
    const { activeSearch, closeActiveSearch, closeQuickOpen, quickOpenEnabled } = this.props;
    const { shortcutsModalEnabled } = this.state;
    const anyTrue = activeSearch || quickOpenEnabled || shortcutsModalEnabled;

    if (anyTrue) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (activeSearch) {
      closeActiveSearch();
    }

    if (quickOpenEnabled) {
      closeQuickOpen();
    }

    if (shortcutsModalEnabled) {
      this.toggleShortcutsModal();
    }
  };

  onCommandSlash = () => {
    this.toggleShortcutsModal();
  };

  isHorizontal() {
    return this.props.orientation === "horizontal";
  }

  toggleFunctionQuickOpenModal = (_, e) => {
    this.toggleQuickOpenModal(_, e, "@", false);
  };

  toggleProjectFunctionQuickOpenModal = (_, e) => {
    this.toggleQuickOpenModal(_, e, "@", true);
  };

  toggleLineQuickOpenModal = (_, e) => {
    this.toggleQuickOpenModal(_, e, ":", false);
  };

  toggleSourceQuickOpenModal = (_, e) => {
    this.toggleQuickOpenModal(_, e, "");
  };

  toggleQuickOpenModal = (_, e, query, project = false) => {
    const { quickOpenEnabled, openQuickOpen, closeQuickOpen } = this.props;

    e.preventDefault();
    e.stopPropagation();

    if (quickOpenEnabled === true) {
      closeQuickOpen();
      return;
    }

    openQuickOpen(query, project);
  };

  renderEditorPane = () => {
    const { startPanelSize } = this.state;
    const horizontal = this.isHorizontal();

    return (
      <div className="editor-pane">
        <div className="editor-container">
          <EditorTabs horizontal={horizontal} />
          <Editor startPanelSize={startPanelSize} />
          {!this.props.selectedSource ? (
            <WelcomeBox
              horizontal={horizontal}
              toggleShortcutsModal={() => this.toggleShortcutsModal()}
            />
          ) : null}
          <EditorFooter horizontal={horizontal} />
          <ProjectSearch />
        </div>
      </div>
    );
  };

  toggleShortcutsModal() {
    this.setState(prevState => ({
      shortcutsModalEnabled: !prevState.shortcutsModalEnabled,
    }));
  }

  // Important so that the tabs chevron updates appropriately when
  // the user resizes the left or right columns
  triggerEditorPaneResize() {
    const editorPane = window.document.querySelector(".editor-pane");
    if (editorPane) {
      editorPane.dispatchEvent(new Event("resizeend"));
    }
  }

  getPanel = () => {
    const { selectedPrimaryPanel } = this.props;

    switch (selectedPrimaryPanel) {
      case "explorer": {
        return <PrimaryPanes />;
      }
      case "debug": {
        return <SecondaryPanes />;
      }
      case "comments": {
        return <Transcript />;
      }
      default: {
        return null;
      }
    }
  };

  renderLayout = () => {
    const { startPanelCollapsed } = this.props;

    return (
      <SplitBox
        style={{ width: "100%" }}
        initialSize={prefs.startPanelSize}
        minSize={30}
        maxSize="85%"
        splitterSize={1}
        onResizeEnd={num => {
          prefs.startPanelSize = num;
        }}
        startPanelCollapsed={startPanelCollapsed}
        startPanel={
          <div className="panes" style={{ width: "100%" }}>
            {this.getPanel()}
          </div>
        }
        endPanel={this.renderEditorPane()}
      />
    );
  };

  renderShortcutsModal() {
    const additionalClass = isMacOS ? "mac" : "";

    if (!features.shortcuts) {
      return;
    }

    return (
      <ShortcutsModal
        additionalClass={additionalClass}
        enabled={this.state.shortcutsModalEnabled}
        handleClose={() => this.toggleShortcutsModal()}
      />
    );
  }

  render() {
    const { quickOpenEnabled } = this.props;
    return (
      <div className="debugger">
        <A11yIntention>
          {this.renderLayout()}
          {quickOpenEnabled === true && (
            <QuickOpenModal
              shortcutsModalEnabled={this.state.shortcutsModalEnabled}
              toggleShortcutsModal={() => this.toggleShortcutsModal()}
            />
          )}
          {this.renderShortcutsModal()}
        </A11yIntention>
      </div>
    );
  }
}

Debugger.childContextTypes = {
  shortcuts: PropTypes.object,
  l10n: PropTypes.object,
};

const mapStateToProps = state => ({
  selectedSource: getSelectedSource(state),
  startPanelCollapsed: getPaneCollapse(state),
  activeSearch: getActiveSearch(state),
  quickOpenEnabled: getQuickOpenEnabled(state),
  orientation: getOrientation(state),
  selectedPanel: getSelectedPanel(state),
  selectedPrimaryPanel: getSelectedPrimaryPanel(state),
});

export default connect(mapStateToProps, {
  setActiveSearch: actions.setActiveSearch,
  closeActiveSearch: actions.closeActiveSearch,
  closeProjectSearch: actions.closeProjectSearch,
  openQuickOpen: actions.openQuickOpen,
  closeQuickOpen: actions.closeQuickOpen,
  refreshCodeMirror: actions.refreshCodeMirror,
})(Debugger);
