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
const FilterSearchBox = require("./FilterSearchBox").default;
const ClearButton = require("./ClearButton").default;
const { FilterDrawerToggle } = require("./FilterDrawerToggle");

const PropTypes = require("prop-types");

class FilterBar extends Component {
  static get propTypes() {
    return {
      filteredMessagesCount: PropTypes.object.isRequired,
      allMessagesById: PropTypes.object,
    };
  }

  shouldComponentUpdate(nextProps) {
    const { filteredMessagesCount, allMessagesById } = this.props;

    if (JSON.stringify(nextProps.filteredMessagesCount) !== JSON.stringify(filteredMessagesCount)) {
      return true;
    }

    if (nextProps.allMessagesById !== allMessagesById) {
      return true;
    }

    return false;
  }

  render() {
    return (
      <div
        className={`webconsole-filteringbar-wrapper text-xs`}
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
  messagesClearEvaluations: actions.messagesClearEvaluations,
  filterTextSet: actions.filterTextSet,
  filterToggle: actions.filterToggle,
})(FilterBar);
