/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";

import type { UIState } from "ui/state";

import Breakpoint from "./Breakpoint";
import BreakpointHeading from "./BreakpointHeading";
import { createHeadlessEditor } from "../../../utils/editor/create-editor";
import { getLocationKey, sortSelectedBreakpoints } from "../../../utils/breakpoint";
import { getSelectedSource, MiniSource } from "ui/reducers/sources";
import { waitForEditor } from "devtools/client/debugger/src/utils/editor/create-editor";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import { actions } from "ui/actions";
import type { Breakpoint as BreakpointType } from "../../../reducers/types";

import type { BreakpointOrLogpointSources } from "../../../selectors/breakpointSources";

const connector = connect(
  (state: UIState) => ({
    selectedSource: getSelectedSource(state),
  }),
  {
    seek: actions.removeBreakpoint,
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type BreakpointsProps = PropsFromRedux & {
  type: "print-statement" | "breakpoint";
  emptyContent: React.ReactNode;
  breakpointSources: BreakpointOrLogpointSources[];
  onRemoveBreakpoint: (cx: Context, breakpoint: BreakpointType) => void;
  onRemoveBreakpoints: (cx: Context, source: MiniSource) => void;
};

interface BreakpointsState {
  editorLoaded: boolean;
}

class Breakpoints extends Component<BreakpointsProps, BreakpointsState> {
  state = {
    editorLoaded: false,
  };
  headlessEditor: any;

  componentDidMount() {
    (async () => {
      await waitForEditor();
      this.setState({ editorLoaded: true });
    })();
  }

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
    const { breakpointSources, emptyContent, onRemoveBreakpoints, onRemoveBreakpoint, type } =
      this.props;
    const { editorLoaded } = this.state;

    if (!breakpointSources.length) {
      return (
        <div className="text-themeBodyColor mx-2 mt-2 mb-4 space-y-3 whitespace-normal rounded-lg bg-themeTextFieldBgcolor p-3 text-center text-xs">
          {emptyContent}
        </div>
      );
    }

    const sources = [...breakpointSources.map(({ source }) => source)];

    return (
      <div className="pane breakpoints-list">
        {editorLoaded &&
          breakpointSources.map(({ source, breakpoints }) => {
            const sortedBreakpoints = sortSelectedBreakpoints(breakpoints);
            const renderedBreakpoints = sortedBreakpoints.map(breakpoint => {
              return (
                <Breakpoint
                  type={type}
                  breakpoint={breakpoint}
                  editor={this.getEditor()}
                  key={getLocationKey(breakpoint.location)}
                  onRemoveBreakpoint={onRemoveBreakpoint}
                />
              );
            });

            return (
              <div className="breakpoints-list-source" key={source.id}>
                <BreakpointHeading
                  breakpoint={sortedBreakpoints[0]}
                  source={source}
                  key="header"
                  onRemoveBreakpoints={onRemoveBreakpoints}
                />
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

export default connector(Breakpoints);
