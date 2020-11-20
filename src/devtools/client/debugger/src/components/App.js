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
import { getSelectedPanel } from "ui/reducers/app.ts";

import { KeyShortcuts } from "devtools-modules";
import Services from "devtools-services";
const shortcuts = new KeyShortcuts({ window, target: document });

const { appinfo } = Services;

const isMacOS = appinfo.OS === "Darwin";

const horizontalLayoutBreakpoint = window.matchMedia("(min-width: 800px)");
const verticalLayoutBreakpoint = window.matchMedia("(min-width: 10px) and (max-width: 799px)");

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

class Debugger extends Component {
  onLayoutChange;
  getChildContext;
  renderEditorPane;
  renderLayout;
  toggleQuickOpenModal;
  onEscape;
  onCommandSlash;

  constructor(props) {
    super(props);
    this.state = {
      shortcutsModalEnabled: false,
      startPanelSize: 0,
      endPanelSize: 0,
    };
  }

  getChildContext = () => {
    return { shortcuts, l10n: L10N };
  };

  componentDidMount() {
    horizontalLayoutBreakpoint.addListener(this.onLayoutChange);
    verticalLayoutBreakpoint.addListener(this.onLayoutChange);
    this.setOrientation();

    shortcuts.on(L10N.getStr("symbolSearch.search.key1"), (_, e) =>
      this.toggleQuickOpenModal(_, e)
    );

    shortcuts.on(L10N.getStr("symbolSearch.search.key2"), (_, e) =>
      this.toggleQuickOpenModal(_, e, "@")
    );

    const searchKeys = [L10N.getStr("sources.search.key2"), L10N.getStr("sources.search.alt.key")];
    searchKeys.forEach(key => shortcuts.on(key, this.toggleQuickOpenModal));

    shortcuts.on(L10N.getStr("gotoLineModal.key3"), (_, e) => this.toggleQuickOpenModal(_, e, ":"));

    shortcuts.on("Escape", this.onEscape);
    shortcuts.on("Cmd+/", this.onCommandSlash);

    this.props.refreshCodeMirror();
  }

  componentWillUnmount() {
    horizontalLayoutBreakpoint.removeListener(this.onLayoutChange);
    verticalLayoutBreakpoint.removeListener(this.onLayoutChange);

    shortcuts.off(L10N.getStr("symbolSearch.search.key1"), this.toggleQuickOpenModal);

    shortcuts.off(L10N.getStr("symbolSearch.search.key2"), this.toggleQuickOpenModal);

    const searchKeys = [L10N.getStr("sources.search.key2"), L10N.getStr("sources.search.alt.key")];
    searchKeys.forEach(key => shortcuts.off(key, this.toggleQuickOpenModal));

    shortcuts.off(L10N.getStr("gotoLineModal.key3"), this.toggleQuickOpenModal);

    shortcuts.off("Escape", this.onEscape);
  }

  componentDidUpdate(prevProps) {
    const { selectedPanel, refreshCodeMirror } = this.props;

    // Only refresh CodeMirror when moving from a non-debugger panel to the debugger panel. Otherwise,
    // the gutter will keep errantly resizing between refreshes.
    if (selectedPanel == "debugger" && prevProps.selectedPanel != selectedPanel) {
      console.log(actions);
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

  toggleQuickOpenModal = (_, e, query) => {
    const { quickOpenEnabled, openQuickOpen, closeQuickOpen } = this.props;

    e.preventDefault();
    e.stopPropagation();

    if (quickOpenEnabled === true) {
      closeQuickOpen();
      return;
    }

    if (query != null) {
      openQuickOpen(query);
      return;
    }
    openQuickOpen();
  };

  onLayoutChange = () => {
    this.setOrientation();
  };

  setOrientation() {
    // If the orientation does not match (if it is not visible) it will
    // not setOrientation, or if it is the same as before, calling
    // setOrientation will not cause a rerender.
    if (horizontalLayoutBreakpoint.matches) {
      this.props.setOrientation("horizontal");
    } else if (verticalLayoutBreakpoint.matches) {
      this.props.setOrientation("vertical");
    }
  }

  renderEditorPane = () => {
    const { startPanelCollapsed, endPanelCollapsed } = this.props;
    const { endPanelSize, startPanelSize } = this.state;
    const horizontal = this.isHorizontal();

    return (
      <div className="editor-pane">
        <div className="editor-container">
          <EditorTabs
            startPanelCollapsed={startPanelCollapsed}
            endPanelCollapsed={endPanelCollapsed}
            horizontal={horizontal}
          />
          <Editor startPanelSize={startPanelSize} endPanelSize={endPanelSize} />
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

  renderLayout = () => {
    const { startPanelCollapsed, endPanelCollapsed } = this.props;
    const horizontal = this.isHorizontal();

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
            {/* <PrimaryPanes horizontal={horizontal} /> */}
            <SecondaryPanes horizontal={horizontal} />
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
  startPanelCollapsed: getPaneCollapse(state, "start"),
  endPanelCollapsed: getPaneCollapse(state, "end"),
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
  setOrientation: actions.setOrientation,
  refreshCodeMirror: actions.refreshCodeMirror,
})(Debugger);
