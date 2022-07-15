/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { createSelector } from "reselect";
import classnames from "classnames";

import type { UIState } from "ui/state";
import actions from "../../../actions";
import { getLocationWithoutColumn, getLocationKey } from "../../../utils/breakpoint";
import { features } from "../../../utils/prefs";
import { getSelectedFrame, getContext } from "../../../selectors";
import type { Breakpoint as BreakpointType } from "../../../reducers/types";
import type { Context } from "devtools/client/debugger/src/reducers/pause";

import BreakpointOptions from "./BreakpointOptions";
import { CloseButton } from "../../shared/Button";

const getFormattedFrame = createSelector(getSelectedFrame, frame => {
  if (!frame) {
    return null;
  }

  return {
    ...frame,
    selectedLocation: frame.location,
  };
});

const mapStateToProps = (state: UIState) => ({
  cx: getContext(state),
  frame: getFormattedFrame(state),
});

const connector = connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

type $FixTypeLater = any;

type BreakpointProps = PropsFromRedux & {
  type: "print-statement" | "breakpoint";
  breakpoint: BreakpointType;
  onRemoveBreakpoint: (cx: Context, breakpoint: BreakpointType) => void;
  editor: $FixTypeLater;
};

class Breakpoint extends PureComponent<BreakpointProps> {
  get selectedLocation() {
    const { breakpoint } = this.props;

    return breakpoint.location;
  }

  selectBreakpoint = (event: React.MouseEvent) => {
    const { cx, selectSpecificLocation } = this.props;
    event.preventDefault();

    selectSpecificLocation(cx, this.selectedLocation);
  };

  removeBreakpoint = (event: React.MouseEvent) => {
    const { cx, onRemoveBreakpoint, breakpoint } = this.props;
    event.stopPropagation();

    onRemoveBreakpoint(cx, breakpoint);
  };

  isCurrentlyPausedAtBreakpoint() {
    const { frame } = this.props;
    if (!frame) {
      return false;
    }

    const bpId = features.columnBreakpoints
      ? getLocationKey(this.selectedLocation)
      : getLocationWithoutColumn(this.selectedLocation);
    const frameId = features.columnBreakpoints
      ? getLocationKey(frame.selectedLocation)
      : getLocationWithoutColumn(frame.selectedLocation);
    return bpId == frameId;
  }

  renderSourceLocation() {
    const { breakpoint } = this.props;
    const { column, line } = breakpoint.location;

    const columnVal = column ? `:${column}` : "";
    const location = `${line}${columnVal}`;

    return <div className="breakpoint-line">{location}</div>;
  }

  render() {
    const { breakpoint, editor, type } = this.props;

    return (
      <div
        className={classnames({
          breakpoint,
          paused: this.isCurrentlyPausedAtBreakpoint(),
        })}
        onClick={this.selectBreakpoint}
      >
        <BreakpointOptions editor={editor} breakpoint={breakpoint} type={type} />
        {this.renderSourceLocation()}
        <CloseButton
          buttonClass={null}
          handleClick={this.removeBreakpoint}
          tooltip={"Remove this breakpoint"}
        />
      </div>
    );
  }
}

export default connector(Breakpoint);
