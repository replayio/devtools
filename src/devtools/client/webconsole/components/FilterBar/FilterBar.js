/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// React & Redux
const React = require("react");
const { Component } = React;
const { connect } = require("react-redux");

// Actions
const actions = require("devtools/client/webconsole/actions/index");

// Selectors
const { getFilteredMessagesCount } = require("devtools/client/webconsole/selectors/messages");
const { getAllMessagesById } = require("devtools/client/webconsole/selectors/messages");

// Constants
const { FILTERBAR_DISPLAY_MODES } = require("devtools/client/webconsole/constants");

const FilterSearchBox = require("./FilterSearchBox").default;
const ClearButton = require("./ClearButton").default;
const { FilterDrawerToggle } = require("./FilterDrawerToggle");
const { isDemo } = require("ui/utils/environment");

const PropTypes = require("prop-types");

class FilterBar extends Component {
  static get propTypes() {
    return {
      displayMode: PropTypes.oneOf([...Object.values(FILTERBAR_DISPLAY_MODES)]).isRequired,
      filteredMessagesCount: PropTypes.object.isRequired,
      allMessagesById: PropTypes.object,
    };
  }

  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    const { displayMode, filteredMessagesCount, allMessagesById } = this.props;

    if (nextProps.displayMode !== displayMode) {
      return true;
    }

    if (JSON.stringify(nextProps.filteredMessagesCount) !== JSON.stringify(filteredMessagesCount)) {
      return true;
    }

    if (nextProps.allMessagesById !== allMessagesById) {
      return true;
    }

    return false;
  }

  render() {
    const { displayMode } = this.props;

    if (isDemo()) {
      return null;
    }

    return (
      <div
        className={`webconsole-filteringbar-wrapper text-xs ${displayMode}`}
        aria-live="off"
        ref={node => (this.wrapperNode = node)}
      >
        <div className="devtools-toolbar devtools-input-toolbar webconsole-filterbar-primary space-x-2 px-2 py-1">
          <FilterDrawerToggle />
          <FilterSearchBox />
          <ClearButton />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    filteredMessagesCount: getFilteredMessagesCount(state),
    allMessagesById: getAllMessagesById(state),
  };
}

export default connect(mapStateToProps, {
  filterBarDisplayModeSet: actions.filterBarDisplayModeSet,
  messagesClearEvaluations: actions.messagesClearEvaluations,
  filterTextSet: actions.filterTextSet,
  filterToggle: actions.filterToggle,
})(FilterBar);
