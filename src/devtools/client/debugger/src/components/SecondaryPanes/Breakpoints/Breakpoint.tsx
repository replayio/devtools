import classnames from "classnames";
import type { Context } from "devtools/client/debugger/src/reducers/pause";
import React, { PureComponent } from "react";
import { connect, ConnectedProps } from "react-redux";
import { createSelector } from "reselect";
import { Point } from "shared/client/types";
import type { UIState } from "ui/state";

import actions from "../../../actions";
import { getSelectedFrame, getContext } from "../../../selectors";
import { compareSourceLocation } from "../../../utils/location";

import { CloseButton } from "../../shared/Button";

import BreakpointOptions from "./BreakpointOptions";

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
  type: "logpoint" | "breakpoint";
  breakpoint: Point;
  onRemoveBreakpoint: (cx: Context, breakpoint: Point) => void;
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

    return compareSourceLocation(this.selectedLocation, frame.selectedLocation);
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
