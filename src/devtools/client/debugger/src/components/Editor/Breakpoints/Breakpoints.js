/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//
import React, { Component } from "react";
import Breakpoint from "./Breakpoint";

import {
  getSelectedSource,
  getFirstVisibleBreakpoints,
} from "devtools/client/debugger/src/selectors";
import { getLocationKey } from "devtools/client/debugger/src/utils/breakpoint";
import { connect } from "devtools/client/debugger/src/utils/connect";

class Breakpoints extends Component {
  render() {
    const { cx, breakpoints, selectedSource, editor } = this.props;

    if (!selectedSource || !breakpoints || selectedSource.isBlackBoxed) {
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

export default connect(state => ({
  // Retrieves only the first breakpoint per line so that the
  // breakpoint marker represents only the first breakpoint
  breakpoints: getFirstVisibleBreakpoints(state),
  selectedSource: getSelectedSource(state),
}))(Breakpoints);
