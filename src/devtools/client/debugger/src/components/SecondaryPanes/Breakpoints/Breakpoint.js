/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { PureComponent } from "react";
import { connect } from "../../../utils/connect";
import { createSelector } from "reselect";
import classnames from "classnames";

import actions from "../../../actions";
import { getLocationWithoutColumn, getLocationKey } from "../../../utils/breakpoint";
import { features } from "../../../utils/prefs";
import { getSelectedFrame, getContext } from "../../../selectors";

import BreakpointOptions from "./BreakpointOptions";
import { CloseButton } from "../../shared/Button";

class Breakpoint extends PureComponent {
  get selectedLocation() {
    const { breakpoint } = this.props;

    return breakpoint.location;
  }

  selectBreakpoint = event => {
    const { cx, selectSpecificLocation } = this.props;
    event.preventDefault();

    selectSpecificLocation(cx, this.selectedLocation);
  };

  removeBreakpoint = event => {
    const { cx, removeBreakpoint, breakpoint } = this.props;
    event.stopPropagation();

    removeBreakpoint(cx, breakpoint);
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
          handleClick={e => this.removeBreakpoint(e)}
          tooltip={"Remove this breakpoint"}
        />
      </div>
    );
  }
}

const getFormattedFrame = createSelector(getSelectedFrame, frame => {
  if (!frame) {
    return null;
  }

  return {
    ...frame,
    selectedLocation: frame.location,
  };
});

const mapStateToProps = state => ({
  cx: getContext(state),
  frame: getFormattedFrame(state),
});

export default connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
  removeBreakpoint: actions.removeBreakpoint,
})(Breakpoint);
