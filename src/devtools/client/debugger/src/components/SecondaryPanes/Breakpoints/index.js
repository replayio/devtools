/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import { connect } from "../../../utils/connect";

import Breakpoint from "./Breakpoint";
import BreakpointHeading from "./BreakpointHeading";

import actions from "../../../actions";
import { createHeadlessEditor } from "../../../utils/editor/create-editor";

import { getLocationKey, sortSelectedBreakpoints } from "../../../utils/breakpoint";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import { getBreakpointSources, getSelectedSource } from "../../../selectors";

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
    const { breakpointSources, selectedSource } = this.props;

    if (!breakpointSources.length) {
      return (
        <div className="onboarding-text p-3 space-y-3 text-gray-500 text-base whitespace-normal">
          <MaterialIcon className="large-icon">info</MaterialIcon>
          <p>{`You haven't added any print statements yet.`}</p>
          {selectedSource ? (
            <>
              <p>{`Try clicking on a line number in the editor.`}</p>
              <img src="/images/comment-onboarding-arrow.svg" className="arrow" />
            </>
          ) : null}
        </div>
      );
    }

    const sources = [...breakpointSources.map(({ source }) => source)];

    return (
      <div className="pane breakpoints-list">
        {breakpointSources.map(({ source, breakpoints, i }) => {
          const sortedBreakpoints = sortSelectedBreakpoints(breakpoints);
          const renderedBreakpoints = sortedBreakpoints.map(breakpoint => {
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

          return (
            <div className="breakpoints-list-source" key={source.id}>
              <BreakpointHeading source={source} key="header" />
              {renderedBreakpoints}
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    return <div className="pane">{this.renderBreakpoints()}</div>;
  }
}

const mapStateToProps = state => ({
  breakpointSources: getBreakpointSources(state),
  selectedSource: getSelectedSource(state),
});

export default connect(mapStateToProps, {
  logExceptions: actions.logExceptions,
})(Breakpoints);
