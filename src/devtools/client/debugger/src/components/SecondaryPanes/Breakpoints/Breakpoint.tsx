import classnames from "classnames";
import React, { PureComponent, Suspense, useContext } from "react";
import { ConnectedProps, connect } from "react-redux";

import {
  Context,
  PauseFrame,
  getSelectedFrameId,
} from "devtools/client/debugger/src/reducers/pause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point, ReplayClientInterface } from "shared/client/types";
import type { UIState } from "ui/state";
import { getPauseFrameSuspense } from "ui/suspense/frameCache";

import actions from "../../../actions";
import { getContext } from "../../../selectors";
import { compareSourceLocation } from "../../../utils/location";
import { CloseButton } from "../../shared/Button";
import BreakpointOptions from "./BreakpointOptions";

const mapStateToProps = (state: UIState) => ({
  cx: getContext(state),
  selectedFrameId: getSelectedFrameId(state),
  sourcesState: state.sources,
});

const connector = connect(mapStateToProps, {
  selectSpecificLocation: actions.selectSpecificLocation,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
interface PropsFromParent {
  breakpoint: Point;
  editor: $FixTypeLater;
  onRemoveBreakpoint: (cx: Context, breakpoint: Point) => void;
  type: "logpoint" | "breakpoint";
}
type BreakpointProps = PropsFromRedux & PropsFromParent & { replayClient: ReplayClientInterface };

type $FixTypeLater = any;

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

  isCurrentlyPausedAtBreakpoint(frame: PauseFrame | undefined) {
    if (!frame) {
      return false;
    }

    return compareSourceLocation(this.selectedLocation, frame.location);
  }

  renderSourceLocation() {
    const { breakpoint } = this.props;
    const { column, line } = breakpoint.location;

    const columnVal = column ? `:${column}` : "";
    const location = `${line}${columnVal}`;

    return <div className="breakpoint-line">{location}</div>;
  }

  render() {
    const { replayClient, breakpoint, editor, type, selectedFrameId, sourcesState } = this.props;
    const frame = selectedFrameId
      ? getPauseFrameSuspense(replayClient, selectedFrameId, sourcesState)
      : undefined;

    return (
      <div
        className={classnames({
          breakpoint,
          paused: this.isCurrentlyPausedAtBreakpoint(frame),
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

const ConnectedBreakpoint = connector(Breakpoint);

export default function BreakpointSuspenseWrapper(props: PropsFromParent) {
  const replayClient = useContext(ReplayClientContext);
  return (
    <Suspense>
      <ConnectedBreakpoint {...props} replayClient={replayClient} />
    </Suspense>
  );
}
