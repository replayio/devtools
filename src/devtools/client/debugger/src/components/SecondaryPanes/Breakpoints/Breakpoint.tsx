import classnames from "classnames";
import { ChangeEvent, PureComponent, Suspense, useContext } from "react";
import { MouseEvent } from "react";
import { ConnectedProps, connect } from "react-redux";

import {
  Context,
  PauseFrame,
  getSelectedFrameId,
} from "devtools/client/debugger/src/reducers/pause";
import { EditPoint } from "replay-next/src/contexts/PointsContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_DISABLED_TEMPORARILY,
  POINT_BEHAVIOR_ENABLED,
  Point,
  ReplayClientInterface,
} from "shared/client/types";
import Checkbox from "ui/components/shared/Forms/Checkbox";
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
  selectLocation: actions.selectLocation,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
interface PropsFromParent {
  breakpoint: Point;
  onEditPoint: EditPoint;
  onRemoveBreakpoint: (cx: Context, breakpoint: Point) => void;
  type: "logpoint" | "breakpoint";
}
type BreakpointProps = PropsFromRedux & PropsFromParent & { replayClient: ReplayClientInterface };

class Breakpoint extends PureComponent<BreakpointProps> {
  get selectedLocation() {
    const { breakpoint } = this.props;

    return breakpoint.location;
  }

  selectBreakpoint = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    const { cx, selectLocation } = this.props;
    event.preventDefault();

    selectLocation(cx, this.selectedLocation);
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
    const {
      cx,
      replayClient,
      breakpoint,
      onEditPoint,
      onRemoveBreakpoint,
      type,
      selectedFrameId,
      sourcesState,
    } = this.props;
    const frame = selectedFrameId
      ? getPauseFrameSuspense(replayClient, selectedFrameId, sourcesState)
      : undefined;

    const behavior = type === "breakpoint" ? breakpoint.shouldBreak : breakpoint.shouldLog;
    const isChecked = behavior === POINT_BEHAVIOR_ENABLED;

    // Prevent clicks on the <input> from selecting the location.
    const onCheckboxClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
      const behavior = event.target.checked
        ? POINT_BEHAVIOR_ENABLED
        : POINT_BEHAVIOR_DISABLED_TEMPORARILY;

      if (type === "breakpoint") {
        onEditPoint(breakpoint.id, {
          shouldBreak: behavior,
        });
      } else {
        onEditPoint(breakpoint.id, {
          shouldLog: behavior,
        });
      }
    };

    const onCloseButtonClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (type === "breakpoint") {
        if (breakpoint.shouldLog === POINT_BEHAVIOR_ENABLED) {
          onEditPoint(breakpoint.id, {
            shouldBreak: POINT_BEHAVIOR_DISABLED,
          });
        } else {
          onRemoveBreakpoint(cx, breakpoint);
        }
      } else {
        if (breakpoint.shouldBreak === POINT_BEHAVIOR_ENABLED) {
          onEditPoint(breakpoint.id, {
            shouldLog: POINT_BEHAVIOR_DISABLED,
          });
        } else {
          onRemoveBreakpoint(cx, breakpoint);
        }
      }
    };

    return (
      <div
        className={classnames({
          breakpoint,
          paused: this.isCurrentlyPausedAtBreakpoint(frame),
        })}
        data-test-name="Breakpoint"
        data-test-type={type}
        data-test-column-index={breakpoint.location.column}
        data-test-line-number={breakpoint.location.line}
        data-test-source-id={breakpoint.location.sourceId}
        onClick={this.selectBreakpoint}
      >
        <label
          data-test-name="BreakpointToggle"
          data-test-state={isChecked ? POINT_BEHAVIOR_ENABLED : POINT_BEHAVIOR_DISABLED_TEMPORARILY}
          onClick={onCheckboxClick}
        >
          <Checkbox checked={isChecked} onChange={onCheckboxChange} />
        </label>
        <BreakpointOptions breakpoint={breakpoint} type={type} />
        {this.renderSourceLocation()}
        <CloseButton
          buttonClass={null}
          handleClick={onCloseButtonClick}
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
