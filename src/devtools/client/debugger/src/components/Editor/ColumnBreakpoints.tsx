/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component } from "react";
import ColumnBreakpoint from "./ColumnBreakpoint";

import { getVisibleColumnBreakpoints, getContext } from "../../selectors";
import { getSelectedSource } from "ui/reducers/sources";
import { connect, ConnectedProps } from "react-redux";
import type { UIState } from "ui/state";
import { getLocationKey } from "../../utils/breakpoint";

// eslint-disable-next-line max-len

const mapStateToProps = (state: UIState) => ({
  cx: getContext(state),
  selectedSource: getSelectedSource(state),
  columnBreakpoints: getVisibleColumnBreakpoints(state),
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

type $FixTypeLater = any;
interface CBProps {
  editor: $FixTypeLater;
}

class ColumnBreakpoints extends Component<PropsFromRedux & CBProps> {
  render() {
    const { cx, editor, columnBreakpoints, selectedSource } = this.props;

    // TODO Re-enable blackboxing
    if (!selectedSource /*|| selectedSource.isBlackBoxed*/ || columnBreakpoints.length === 0) {
      return null;
    }

    let breakpoints;
    // TODO Is this a safe thing to do while rendering?
    editor.codeMirror.operation(() => {
      breakpoints = columnBreakpoints.map((breakpoint, i) => (
        <ColumnBreakpoint
          cx={cx}
          key={getLocationKey(breakpoint.location)}
          columnBreakpoint={breakpoint}
          editor={editor}
          source={selectedSource}
          insertAt={i}
        />
      ));
    });
    return <div>{breakpoints}</div>;
  }
}

export default connector(ColumnBreakpoints);
