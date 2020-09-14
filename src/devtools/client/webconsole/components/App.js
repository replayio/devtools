/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const Services = require("Services");
const { Component, createFactory } = require("react");
const PropTypes = require("prop-types");
const dom = require("react-dom-factories");
const { connect } = require("devtools/client/shared/redux/visibility-handler-connect");

const actions = require("devtools/client/webconsole/actions/index");
const { FILTERBAR_DISPLAY_MODES } = require("devtools/client/webconsole/constants");

// We directly require Components that we know are going to be used right away
const ConsoleOutput = createFactory(
  require("devtools/client/webconsole/components/Output/ConsoleOutput")
);
const FilterBar = createFactory(
  require("devtools/client/webconsole/components/FilterBar/FilterBar")
);
const ReverseSearchInput = createFactory(
  require("devtools/client/webconsole/components/Input/ReverseSearchInput")
);
const JSTerm = createFactory(require("devtools/client/webconsole/components/Input/JSTerm"));
const ConfirmDialog = createFactory(
  require("devtools/client/webconsole/components/Input/ConfirmDialog")
);
const EagerEvaluation = createFactory(
  require("devtools/client/webconsole/components/Input/EagerEvaluation")
);

// And lazy load the ones that may not be used.
const SideBar = createFactory(require("devtools/client/webconsole/components/SideBar"));

const EditorToolbar = createFactory(
  require("devtools/client/webconsole/components/Input/EditorToolbar")
);

const NotificationBox = createFactory(
  require("devtools/client/shared/components/NotificationBox").NotificationBox
);
const {
  getNotificationWithValue,
  PriorityLevels,
} = require("devtools/client/shared/components/NotificationBox");

const GridElementWidthResizer = createFactory(
  require("devtools/client/shared/components/splitter/GridElementWidthResizer")
);

const l10n = require("devtools/client/webconsole/utils/l10n");

const { getAllNotifications } = require("devtools/client/webconsole/selectors/notifications");
const { div } = dom;
const isMacOS = Services.appinfo.OS === "Darwin";

require("./App.css");

/**
 * Console root Application component.
 */
class App extends Component {
  static get propTypes() {
    return {
      dispatch: PropTypes.func.isRequired,
      webConsoleUI: PropTypes.object.isRequired,
      notifications: PropTypes.object,
      onFirstMeaningfulPaint: PropTypes.func.isRequired,
      serviceContainer: PropTypes.object.isRequired,
      closeSplitConsole: PropTypes.func.isRequired,
      autocomplete: PropTypes.bool,
      currentReverseSearchEntry: PropTypes.string,
      reverseSearchInputVisible: PropTypes.bool,
      reverseSearchInitialValue: PropTypes.string,
      editorMode: PropTypes.bool,
      editorWidth: PropTypes.number,
      sidebarVisible: PropTypes.bool.isRequired,
      eagerEvaluationEnabled: PropTypes.bool.isRequired,
      filterBarDisplayMode: PropTypes.oneOf([...Object.values(FILTERBAR_DISPLAY_MODES)]).isRequired,
    };
  }

  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  componentDidMount() {
    window.addEventListener("blur", this.onBlur);
  }

  onBlur() {
    this.props.dispatch(actions.autocompleteClear());
  }

  onKeyDown(event) {
    const { dispatch, webConsoleUI } = this.props;

    if (
      (!isMacOS && event.key === "F9") ||
      (isMacOS && event.key === "r" && event.ctrlKey === true)
    ) {
      const initialValue = webConsoleUI.jsterm && webConsoleUI.jsterm.getSelectedText();
      dispatch(actions.reverseSearchInputToggle({ initialValue }));
      event.stopPropagation();
    }

    if (
      event.key.toLowerCase() === "b" &&
      ((isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey))
    ) {
      event.stopPropagation();
      event.preventDefault();
      dispatch(actions.editorToggle());
    }
  }

  onClick(event) {
    const target = event.originalTarget || event.target;
    const { reverseSearchInputVisible, dispatch, webConsoleUI } = this.props;

    if (reverseSearchInputVisible === true && !target.closest(".reverse-search")) {
      event.preventDefault();
      event.stopPropagation();
      dispatch(actions.reverseSearchInputToggle());
      return;
    }

    // Do not focus on middle/right-click or 2+ clicks.
    if (event.detail !== 1 || event.button !== 0) {
      return;
    }

    // Do not focus if a link was clicked
    if (target.closest("a")) {
      return;
    }

    // Do not focus if an input field was clicked
    if (target.closest("input")) {
      return;
    }

    // Do not focus if the click happened in the reverse search toolbar.
    if (target.closest(".reverse-search")) {
      return;
    }

    // Do not focus if something other than the output region was clicked
    // (including e.g. the clear messages button in toolbar)
    if (!target.closest(".webconsole-app")) {
      return;
    }

    // Do not focus if something is selected
    const selection = webConsoleUI.document.defaultView.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }

    if (webConsoleUI && webConsoleUI.jsterm) {
      webConsoleUI.jsterm.focus();
    }
  }

  renderFilterBar() {
    const { closeSplitConsole, filterBarDisplayMode, webConsoleUI } = this.props;

    return FilterBar({
      key: "filterbar",
      closeSplitConsole,
      displayMode: filterBarDisplayMode,
      webConsoleUI,
    });
  }

  renderEditorToolbar() {
    const {
      editorMode,
      dispatch,
      reverseSearchInputVisible,
      serviceContainer,
      webConsoleUI,
    } = this.props;

    return editorMode
      ? EditorToolbar({
          key: "editor-toolbar",
          editorMode,
          dispatch,
          reverseSearchInputVisible,
          serviceContainer,
          webConsoleUI,
        })
      : null;
  }

  renderConsoleOutput() {
    const { onFirstMeaningfulPaint, serviceContainer } = this.props;

    return ConsoleOutput({
      key: "console-output",
      serviceContainer,
      onFirstMeaningfulPaint,
    });
  }

  renderJsTerm() {
    const { webConsoleUI, serviceContainer, autocomplete, editorMode, editorWidth } = this.props;

    return JSTerm({
      key: "jsterm",
      webConsoleUI,
      serviceContainer,
      autocomplete,
      editorMode,
      editorWidth,
    });
  }

  renderEagerEvaluation() {
    const { eagerEvaluationEnabled, serviceContainer } = this.props;
    if (!eagerEvaluationEnabled) {
      return null;
    }

    return EagerEvaluation({ serviceContainer });
  }

  renderReverseSearch() {
    const { serviceContainer, reverseSearchInitialValue } = this.props;

    return ReverseSearchInput({
      key: "reverse-search-input",
      setInputValue: serviceContainer.setInputValue,
      focusInput: serviceContainer.focusInput,
      initialValue: reverseSearchInitialValue,
    });
  }

  renderSideBar() {
    const { serviceContainer, sidebarVisible } = this.props;
    return sidebarVisible
      ? SideBar({
          key: "sidebar",
          serviceContainer,
          visible: sidebarVisible,
        })
      : null;
  }

  renderNotificationBox() {
    const { notifications, editorMode } = this.props;

    return notifications && notifications.size > 0
      ? NotificationBox({
          id: "webconsole-notificationbox",
          key: "notification-box",
          displayBorderTop: !editorMode,
          displayBorderBottom: editorMode,
          wrapping: true,
          notifications,
        })
      : null;
  }

  renderConfirmDialog() {
    const { webConsoleUI, serviceContainer } = this.props;

    return ConfirmDialog({
      webConsoleUI,
      serviceContainer,
      key: "confirm-dialog",
    });
  }

  renderRootElement(children) {
    const { editorMode, serviceContainer, sidebarVisible } = this.props;

    const classNames = ["webconsole-app"];
    if (sidebarVisible) {
      classNames.push("sidebar-visible");
    }
    if (editorMode) {
      classNames.push("jsterm-editor");
    }
    if (serviceContainer.canRewind()) {
      classNames.push("can-rewind");
    }

    if (this.props.eagerEvaluationEnabled) {
      classNames.push("eager-evaluation");
    }

    return div(
      {
        className: classNames.join(" "),
        onKeyDown: this.onKeyDown,
        onClick: this.onClick,
        ref: node => {
          this.node = node;
        },
      },
      children
    );
  }

  render() {
    const { webConsoleUI, editorMode, dispatch } = this.props;
    const filterBar = this.renderFilterBar();
    const editorToolbar = this.renderEditorToolbar();
    const consoleOutput = this.renderConsoleOutput();
    const notificationBox = this.renderNotificationBox();
    const jsterm = this.renderJsTerm();
    const eager = this.renderEagerEvaluation();
    const reverseSearch = this.renderReverseSearch();
    const sidebar = this.renderSideBar();
    const confirmDialog = this.renderConfirmDialog();

    return this.renderRootElement([
      filterBar,
      editorToolbar,
      dom.div(
        { className: "flexible-output-input", key: "in-out-container" },
        consoleOutput,
        notificationBox,
        jsterm,
        eager
      ),
      editorMode
        ? GridElementWidthResizer({
            key: "editor-resizer",
            enabled: editorMode,
            position: "end",
            className: "editor-resizer",
            getControlledElementNode: () => webConsoleUI.jsterm.node,
            onResizeEnd: width => dispatch(actions.setEditorWidth(width)),
          })
        : null,
      reverseSearch,
      sidebar,
      confirmDialog,
    ]);
  }
}

const mapStateToProps = state => ({
  notifications: getAllNotifications(state),
  reverseSearchInputVisible: state.ui.reverseSearchInputVisible,
  reverseSearchInitialValue: state.ui.reverseSearchInitialValue,
  editorMode: state.ui.editor,
  editorWidth: state.ui.editorWidth,
  sidebarVisible: state.ui.sidebarVisible,
  filterBarDisplayMode: state.ui.filterBarDisplayMode,
  eagerEvaluationEnabled: state.prefs.eagerEvaluation,
  autocomplete: state.prefs.autocomplete,
});

const mapDispatchToProps = dispatch => ({
  dispatch,
});

module.exports = connect(mapStateToProps, mapDispatchToProps)(App);
