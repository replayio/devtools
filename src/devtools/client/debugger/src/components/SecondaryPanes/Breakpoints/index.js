/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import { connect } from "../../../utils/connect";

import Breakpoint from "./Breakpoint";

import actions from "../../../actions";
import { createHeadlessEditor } from "../../../utils/editor/create-editor";

import { getLocationKey, sortSelectedBreakpoints } from "../../../utils/breakpoint";

import { getBreakpointSources } from "../../../selectors";

import "./Breakpoints.css";

class Breakpoints extends Component {
  headlessEditor;

  componentWillUnmount() {
    this.removeEditor();
  }

  getEditor() {
    if (!this.headlessEditor) {
      this.headlessEditor = createHeadlessEditor();
    }
    return this.headlessEditor;
  }

  removeEditor() {
    if (!this.headlessEditor) {
      return;
    }
    this.headlessEditor.destroy();
    this.headlessEditor = null;
  }

  renderBreakpoints() {
    const { breakpointSources } = this.props;
    if (!breakpointSources.length) {
      return null;
    }

    const sources = [...breakpointSources.map(({ source }) => source)];

    return (
      <div className="pane breakpoints-list">
        {breakpointSources.map(({ source, breakpoints, i }) => {
          const sortedBreakpoints = sortSelectedBreakpoints(breakpoints);

          return sortedBreakpoints.map(breakpoint => {
            return (
              <Breakpoint
                breakpoint={breakpoint}
                source={source}
                sources={sources}
                editor={this.getEditor()}
                key={getLocationKey(breakpoint.location)}
              />
            );
          });
        })}
      </div>
    );
  }

  render() {
    return (
      <div className="pane">
        {/* {this.renderExceptionsOptions()} */}
        {this.renderBreakpoints()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  breakpointSources: getBreakpointSources(state),
});

export default connect(mapStateToProps, {
  logExceptions: actions.logExceptions,
})(Breakpoints);
