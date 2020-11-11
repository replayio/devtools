/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import { connect } from "../../../utils/connect";

import Breakpoint from "./Breakpoint";

import actions from "../../../actions";
import { createHeadlessEditor } from "../../../utils/editor/create-editor";

import { makeBreakpointId, sortSelectedBreakpoints } from "../../../utils/breakpoint";

import { getBreakpointSources } from "../../../selectors";

import "./Breakpoints.css";

class Breakpoints extends Component {
  headlessEditor;
  state = {
    zoomedBreakpoint: null,
  };

  setZoomedBreakpoint = breakpoint => {
    this.setState({ zoomedBreakpoint: breakpoint });
  };

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
    const { zoomedBreakpoint } = this.state;
    if (!breakpointSources.length) {
      return null;
    }

    const sources = [...breakpointSources.map(({ source }) => source)];

    return (
      <div className="pane breakpoints-list">
        {breakpointSources.map(({ source, breakpoints, i }) => {
          const sortedBreakpoints = sortSelectedBreakpoints(breakpoints);

          return sortedBreakpoints.map(breakpoint => {
            const zoomed = breakpoint.id === zoomedBreakpoint?.id;

            return (
              <Breakpoint
                breakpoint={breakpoint}
                source={source}
                sources={sources}
                editor={this.getEditor()}
                key={makeBreakpointId(breakpoint.location)}
                setZoomedBreakpoint={this.setZoomedBreakpoint}
                zoomed={zoomed}
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
