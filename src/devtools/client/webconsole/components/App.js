/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const React = require("react");
const PropTypes = require("prop-types");
const { connect } = require("devtools/client/shared/redux/visibility-handler-connect");
const { FILTERBAR_DISPLAY_MODES } = require("devtools/client/webconsole/constants");

// We directly require Components that we know are going to be used right away
const ConsoleOutput = require("devtools/client/webconsole/components/Output/ConsoleOutput");
const FilterBar = require("devtools/client/webconsole/components/FilterBar/FilterBar").default;
const JSTerm = require("devtools/client/webconsole/components/Input/JSTerm").default;
const MaterialIcon = require("ui/components/shared/MaterialIcon").default;

/**
 * Console root Application component.
 */
class App extends React.Component {
  static get propTypes() {
    return {
      dispatch: PropTypes.func.isRequired,
      filterBarDisplayMode: PropTypes.oneOf([...Object.values(FILTERBAR_DISPLAY_MODES)]).isRequired,
    };
  }

  onClick = event => {
    const target = event.originalTarget || event.target;

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

    // Do not focus if something other than the output region was clicked
    // (including e.g. the clear messages button in toolbar)
    if (!target.closest(".webconsole-app")) {
      return;
    }

    // Do not focus if something is selected
    const selection = document.defaultView.getSelection();
    if (selection && !selection.isCollapsed) {
      return;
    }

    window.jsterm.focus();
  };

  renderConsoleHat() {
    return (
      <div className="bg-secondaryAccent text-white py-1 px-2 flex space-x-2 items-center">
        <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
        <div className="text-xs flex flex-col">
          <div>Check out our best feature</div>
          <div className="font-bold">Try playing to one of our console logs</div>
        </div>
      </div>
    );
  }

  render() {
    const { filterBarDisplayMode } = this.props;

    return (
      <div
        className="webconsole-app"
        onClick={this.onClick}
        ref={node => {
          this.node = node;
        }}
      >
        <FilterBar key="filterbar" displayMode={filterBarDisplayMode} />
        {this.renderConsoleHat()}
        <div className="flexible-output-input" key="in-out-container">
          <ConsoleOutput key="console-output" />
          <JSTerm key="jsterm" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    filterBarDisplayMode: state.consoleUI.filterBarDisplayMode,
  };
};

module.exports = connect(mapStateToProps)(App);
