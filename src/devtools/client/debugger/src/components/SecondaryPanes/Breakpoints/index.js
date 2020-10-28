/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import classnames from "classnames";
import { connect } from "../../../utils/connect";

import ExceptionOption from "./ExceptionOption";

import Breakpoint from "./Breakpoint";
import BreakpointHeading from "./BreakpointHeading";

import actions from "../../../actions";
import { createHeadlessEditor } from "../../../utils/editor/create-editor";

import { makeBreakpointId, sortSelectedBreakpoints } from "../../../utils/breakpoint";

import {
  getSelectedSource,
  getBreakpointSources,
  getShouldLogExceptions,
} from "../../../selectors";

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

  renderExceptionsOptions() {
    const { breakpointSources, shouldLogExceptions, logExceptions } = this.props;

    const isEmpty = breakpointSources.length == 0;

    return (
      <div
        className={classnames("breakpoints-exceptions-options", {
          empty: isEmpty,
        })}
      >
        <ExceptionOption
          className="breakpoints-exceptions"
          label={L10N.getStr("logExceptionsItem")}
          isChecked={shouldLogExceptions}
          onChange={() => logExceptions(!shouldLogExceptions)}
        />
      </div>
    );
  }

  renderBreakpoints() {
    const { breakpointSources, selectedSource, sidebar } = this.props;
    if (!breakpointSources.length) {
      return null;
    }

    const sources = [...breakpointSources.map(({ source, breakpoints }) => source)];

    return (
      <div className="pane breakpoints-list">
        {breakpointSources.map(({ source, breakpoints, i }) => {
          const sortedBreakpoints = sortSelectedBreakpoints(breakpoints, selectedSource);

          return [
            <BreakpointHeading key={source.id} source={source} sources={sources} />,
            ...sortedBreakpoints.map(breakpoint => (
              <Breakpoint
                breakpoint={breakpoint}
                source={source}
                selectedSource={selectedSource}
                editor={this.getEditor()}
                key={makeBreakpointId(breakpoint.location)}
              />
            )),
          ];
        })}
      </div>
    );
  }

  render() {
    const pane = (
      <div className="pane">
        {this.renderExceptionsOptions()}
        {this.renderBreakpoints()}
      </div>
    );

    if (this.props.sidebar) {
      return (
        <div className="logpoints">
          <div className="pane-header">
            <div className="img logpoint" />
            <div className="pane-header-content">Logpoints</div>
          </div>
          {pane}
        </div>
      );
    }

    return pane;
  }
}

const mapStateToProps = state => ({
  breakpointSources: getBreakpointSources(state),
  selectedSource: getSelectedSource(state),
  shouldLogExceptions: getShouldLogExceptions(state),
});

export default connect(mapStateToProps, {
  logExceptions: actions.logExceptions,
})(Breakpoints);
