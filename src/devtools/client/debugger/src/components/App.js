/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Component, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

import { connect } from "../utils/connect";
import { features } from "../utils/prefs";
import actions from "../actions";
import { setUnexpectedError } from "ui/actions/session";
import A11yIntention from "./A11yIntention";
import { ShortcutsModal } from "./ShortcutsModal";

import {
  getSelectedSource,
  getPaneCollapse,
  getActiveSearch,
  getQuickOpenEnabled,
  getOrientation,
} from "../selectors";
import { getSelectedPanel } from "ui/reducers/app.ts";
import { useGetUserSettings } from "ui/hooks/settings";

import { KeyShortcuts } from "devtools-modules";
import Services from "devtools-services";

const globalShortcuts = new KeyShortcuts({ window, target: document });

const { appinfo } = Services;

const isMacOS = appinfo.OS === "Darwin";

import "./App.css";

import "devtools/client/themes/variables.css";
import "devtools/client/themes/webconsole.css";
import "devtools/client/themes/common.css";

import "./shared/menu.css";

import ProjectSearch from "./ProjectSearch";
import Editor from "./Editor";
import WelcomeBox from "./WelcomeBox";
import EditorTabs from "./Editor/Tabs";
import EditorFooter from "./Editor/Footer";
import QuickOpenModal from "./QuickOpenModal";
import SidePanel from "ui/components/SidePanel";
import { waitForEditor } from "../utils/editor/create-editor";
import { isDemo } from "ui/utils/environment";
import { ReplayUpdatedError } from "ui/components/ErrorBoundary";

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
    return { globalShortcuts, shortcuts: this.shortcuts, l10n: L10N };
  };

  constructor(props) {
    super(props);
    this.shortcuts = new KeyShortcuts({ window, target: props.wrapper });
  }

  componentDidMount() {
    globalShortcuts.on("CmdOrCtrl+Shift+P", this.toggleSourceQuickOpenModal);
    globalShortcuts.on("CmdOrCtrl+Shift+O", this.toggleFunctionQuickOpenModal);
    globalShortcuts.on("CmdOrCtrl+P", this.toggleSourceQuickOpenModal);
    if (this.props.enableGlobalSearch) {
      globalShortcuts.on("CmdOrCtrl+O", this.toggleProjectFunctionQuickOpenModal);
    }
    globalShortcuts.on("Cmd+/", this.onCommandSlash);

    this.shortcuts.on("Ctrl+G", this.toggleLineQuickOpenModal);
    this.shortcuts.on("Escape", this.onEscape);

    this.props.refreshCodeMirror();
  }

  componentWillUnmount() {
    globalShortcuts.off("CmdOrCtrl+Shift+P", this.toggleSourceQuickOpenModal);
    globalShortcuts.off("CmdOrCtrl+Shift+O", this.toggleFunctionQuickOpenModal);
    globalShortcuts.off("CmdOrCtrl+P", this.toggleSourceQuickOpenModal);
    if (this.props.enableGlobalSearch) {
      globalShortcuts.off("CmdOrCtrl+O", this.toggleProjectFunctionQuickOpenModal);
    }
    globalShortcuts.off("Cmd+/", this.onCommandSlash);

    this.shortcuts.off("Ctrl+G", this.toggleLineQuickOpenModal);
    this.shortcuts.off("Escape", this.onEscape);
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
    this.toggleQuickOpenModal(_, e, "@");
  };

  toggleProjectFunctionQuickOpenModal = (_, e) => {
    this.toggleQuickOpenModal(_, e, "@", true);
  };

  toggleLineQuickOpenModal = (_, e) => {
    this.toggleQuickOpenModal(_, e, ":");
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
          {!isDemo() && <EditorTabs horizontal={horizontal} />}
          <Editor startPanelSize={startPanelSize} />
          {!this.props.selectedSource ? (
            <WelcomeBox
              horizontal={horizontal}
              toggleShortcutsModal={() => this.toggleShortcutsModal()}
            />
          ) : null}
          {!isDemo() && <EditorFooter horizontal={horizontal} />}
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

  renderLayout = () => {
    const { startPanelCollapsed } = this.props;

    if (isDemo()) {
      return this.renderEditorPane();
    }

    return (
      <div className="horizontal-panels">
        {!startPanelCollapsed ? <SidePanel /> : null}
        {this.renderEditorPane()}
      </div>
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
        enableGlobalSearch={this.props.enableGlobalSearch}
      />
    );
  }

  render() {
    const { quickOpenEnabled } = this.props;
    return (
      <>
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
  const [loadingEditor, setLoadingEditor] = useState(true);
  const wrapperNode = useRef();
  const { userSettings, loading: loadingSettings } = useGetUserSettings();

  useEffect(() => {
    (async () => {
      try {
        await waitForEditor();
        setLoadingEditor(false);
      } catch {
        props.setUnexpectedError(ReplayUpdatedError, true);
      }
    })();
  }, []);

  return (
    <div className="debugger" ref={wrapperNode}>
      {loadingEditor || loadingSettings ? null : (
        <Debugger
          {...props}
          wrapper={wrapperNode.current}
          enableGlobalSearch={userSettings.enableGlobalSearch}
        />
      )}
    </div>
  );
}

const mapStateToProps = state => ({
  selectedSource: getSelectedSource(state),
  startPanelCollapsed: getPaneCollapse(state),
  activeSearch: getActiveSearch(state),
  quickOpenEnabled: getQuickOpenEnabled(state),
  orientation: getOrientation(state),
  selectedPanel: getSelectedPanel(state),
});

export default connect(mapStateToProps, {
  setActiveSearch: actions.setActiveSearch,
  closeActiveSearch: actions.closeActiveSearch,
  closeProjectSearch: actions.closeProjectSearch,
  openQuickOpen: actions.openQuickOpen,
  closeQuickOpen: actions.closeQuickOpen,
  refreshCodeMirror: actions.refreshCodeMirror,
  setUnexpectedError,
})(DebuggerLoader);
