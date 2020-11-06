/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// React & Redux
const React = require("react");
const { Component, createFactory, useState } = React;
const { connect } = require("react-redux");
const dom = require("react-dom-factories");

// Actions
const actions = require("devtools/client/webconsole/actions/index");

// Selectors
const { getAllFilters } = require("devtools/client/webconsole/selectors/filters");
const { getFilteredMessagesCount } = require("devtools/client/webconsole/selectors/messages");
const { getAllUi } = require("devtools/client/webconsole/selectors/ui");

// Utilities
const { l10n } = require("devtools/client/webconsole/utils/messages");
const { PluralForm } = require("devtools/shared/plural-form");

// Constants
const { FILTERBAR_DISPLAY_MODES } = require("devtools/client/webconsole/constants");

// Additional Components
const { Events } = require("devtools/client/webconsole/components/FilterBar/Events");
const ConsoleSettings = createFactory(
  require("devtools/client/webconsole/components/FilterBar/ConsoleSettings")
);
const SearchBox = createFactory(require("devtools/client/shared/components/SearchBox"));

const PropTypes = require("prop-types");

class FilterBar extends Component {
  static get propTypes() {
    return {
      closeButtonVisible: PropTypes.bool,
      displayMode: PropTypes.oneOf([...Object.values(FILTERBAR_DISPLAY_MODES)]).isRequired,
      filteredMessagesCount: PropTypes.object.isRequired,
      timestampsVisible: PropTypes.bool.isRequired,
    };
  }

  constructor(props) {
    super(props);
    this.maybeUpdateLayout = this.maybeUpdateLayout.bind(this);
    this.resizeObserver = new ResizeObserver(this.maybeUpdateLayout);
  }

  componentDidMount() {
    this.filterInputMinWidth = 150;
    try {
      const filterInput = this.wrapperNode.querySelector(".devtools-searchbox");
      this.filterInputMinWidth = Number(
        window.getComputedStyle(filterInput)["min-width"].replace("px", "")
      );
    } catch (e) {
      // If the min-width of the filter input isn't set, or is set in a different unit
      // than px.
      console.error("min-width of the filter input couldn't be retrieved.", e);
    }

    this.maybeUpdateLayout();
    this.resizeObserver.observe(this.wrapperNode);
  }

  shouldComponentUpdate(nextProps) {
    const {
      closeButtonVisible,
      displayMode,
      filteredMessagesCount,
      timestampsVisible,
    } = this.props;

    if (
      nextProps.closeButtonVisible !== closeButtonVisible ||
      nextProps.displayMode !== displayMode ||
      nextProps.timestampsVisible !== timestampsVisible
    ) {
      return true;
    }

    if (JSON.stringify(nextProps.filteredMessagesCount) !== JSON.stringify(filteredMessagesCount)) {
      return true;
    }

    return false;
  }

  /**
   * Update the boolean state that informs where the filter buttons should be rendered.
   * If the filter buttons are rendered inline with the filter input and the filter
   * input width is reduced below a threshold, the filter buttons are rendered on a new
   * row. When the filter buttons are on a separate row and the filter input grows
   * wide enough to display the filter buttons without dropping below the threshold,
   * the filter buttons are rendered inline.
   */
  maybeUpdateLayout() {
    const { filterBarDisplayModeSet, displayMode } = this.props;

    // If we don't have the wrapperNode reference, or if the wrapperNode isn't connected
    // anymore, we disconnect the resize observer (componentWillUnmount is never called
    // on this component, so we have to do it here).
    if (!this.wrapperNode || !this.wrapperNode.isConnected) {
      this.resizeObserver.disconnect();
      return;
    }

    const filterInput = this.wrapperNode.querySelector(".devtools-searchbox");
    const { width: filterInputWidth } = filterInput.getBoundingClientRect();

    if (displayMode === FILTERBAR_DISPLAY_MODES.WIDE) {
      if (filterInputWidth <= this.filterInputMinWidth) {
        filterBarDisplayModeSet(FILTERBAR_DISPLAY_MODES.NARROW);
      }

      return;
    }

    if (displayMode === FILTERBAR_DISPLAY_MODES.NARROW) {
      const filterButtonsToolbar = this.wrapperNode.querySelector(
        ".webconsole-filterbar-secondary"
      );

      const buttonMargin = 5;
      const filterButtonsToolbarWidth = Array.from(filterButtonsToolbar.children).reduce(
        (width, el) => width + el.getBoundingClientRect().width + buttonMargin,
        0
      );

      if (filterInputWidth - this.filterInputMinWidth > filterButtonsToolbarWidth) {
        filterBarDisplayModeSet(FILTERBAR_DISPLAY_MODES.WIDE);
      }
    }
  }

  renderSeparator() {
    return dom.div({
      className: "devtools-separator",
    });
  }

  renderClearButton() {
    const { messagesClearEvaluations } = this.props;

    return dom.button({
      className: "devtools-button devtools-clear-icon",
      title: l10n.getStr("webconsole.clearButton.tooltip"),
      onClick: messagesClearEvaluations,
    });
  }

  renderSearchBox() {
    const { filteredMessagesCount, filterTextSet } = this.props;

    let searchBoxSummary;
    let searchBoxSummaryTooltip;
    if (filteredMessagesCount.text > 0) {
      searchBoxSummary = l10n.getStr("webconsole.filteredMessagesByText.label");
      searchBoxSummary = PluralForm.get(filteredMessagesCount.text, searchBoxSummary).replace(
        "#1",
        filteredMessagesCount.text
      );

      searchBoxSummaryTooltip = l10n.getStr("webconsole.filteredMessagesByText.tooltip");
      searchBoxSummaryTooltip = PluralForm.get(
        filteredMessagesCount.text,
        searchBoxSummaryTooltip
      ).replace("#1", filteredMessagesCount.text);
    }

    return SearchBox({
      type: "filter",
      placeholder: l10n.getStr("webconsole.filterInput.placeholder"),
      keyShortcut: l10n.getStr("webconsole.find.key"),
      onChange: text => filterTextSet(text),
      summary: searchBoxSummary,
      summaryTooltip: searchBoxSummaryTooltip,
    });
  }

  renderSettingsButton() {
    const { timestampsVisible } = this.props;

    return ConsoleSettings({
      timestampsVisible,
    });
  }

  renderCloseButton() {
    const { closeSplitConsole } = this.props;

    return dom.div(
      {
        className: "devtools-toolbar split-console-close-button-wrapper",
        key: "wrapper",
      },
      dom.button({
        id: "split-console-close-button",
        key: "split-console-close-button",
        className: "devtools-button",
        title: l10n.getStr("webconsole.closeSplitConsoleButton.tooltip"),
        onClick: () => closeSplitConsole(),
      })
    );
  }

  render() {
    const { closeButtonVisible, displayMode } = this.props;

    const isNarrow = displayMode === FILTERBAR_DISPLAY_MODES.NARROW;
    const isWide = displayMode === FILTERBAR_DISPLAY_MODES.WIDE;

    const separator = this.renderSeparator();
    const clearButton = this.renderClearButton();
    const searchBox = this.renderSearchBox();
    const settingsButton = this.renderSettingsButton();

    const children = [
      dom.div(
        {
          className: "devtools-toolbar devtools-input-toolbar webconsole-filterbar-primary",
          key: "primary-bar",
        },
        clearButton,
        separator,
        searchBox,
        isWide && separator,
        <Events />,
        separator,
        settingsButton
      ),
    ];

    if (closeButtonVisible) {
      children.push(this.renderCloseButton());
    }

    return dom.div(
      {
        className: `webconsole-filteringbar-wrapper ${displayMode}`,
        "aria-live": "off",
        ref: node => {
          this.wrapperNode = node;
        },
      },
      children
    );
  }
}

function mapStateToProps(state) {
  const uiState = getAllUi(state);
  return {
    closeButtonVisible: uiState.closeButtonVisible,
    filteredMessagesCount: getFilteredMessagesCount(state),
    timestampsVisible: uiState.timestampsVisible,
  };
}

export default connect(mapStateToProps, {
  closeSplitConsole: actions.closeSplitConsole,
  filterBarDisplayModeSet: actions.filterBarDisplayModeSet,
  messagesClearEvaluations: actions.messagesClearEvaluations,
  filterTextSet: actions.filterTextSet,
  filterToggle: actions.filterToggle,
})(FilterBar);
