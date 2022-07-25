/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import type { UIState } from "ui/state";
import type { Context } from "../../../reducers/pause";
import Breakpoint from "./Breakpoint";

import { getFirstVisibleBreakpoints } from "devtools/client/debugger/src/selectors";
import { getSelectedSource } from "ui/reducers/sources";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";

const connector = connect((state: UIState) => ({
  // Retrieves only the first breakpoint per line so that the
  // breakpoint marker represents only the first breakpoint
  breakpoints: getFirstVisibleBreakpoints(state),
  selectedSource: getSelectedSource(state),
}));

type $FixTypeLater = any;

type PropsFromRedux = ConnectedProps<typeof connector>;
type BreakpointsProps = PropsFromRedux & {
  editor: $FixTypeLater;
  cx: Context;
};

class Breakpoints extends Component<BreakpointsProps> {
  render() {
    const { cx, breakpoints, selectedSource, editor } = this.props;

    // TODO Fix blackboxing
    if (!selectedSource || !breakpoints /*|| selectedSource.isBlackBoxed*/) {
      return null;
    }

    return (
      <div>
        {breakpoints.map(bp => {
          return (
            <Breakpoint
              cx={cx}
              key={getLocationKey(bp.location)}
              breakpoint={bp}
              selectedSource={selectedSource}
              editor={editor}
            />
          );
        })}
      </div>
    );
  }
}

export default connector(Breakpoints);
