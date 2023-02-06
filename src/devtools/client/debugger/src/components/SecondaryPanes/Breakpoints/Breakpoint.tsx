import { Location } from "@replayio/protocol";
import classnames from "classnames";
import { ChangeEvent, PureComponent, Suspense, useContext } from "react";
import { MouseEvent } from "react";
import { ConnectedProps, connect } from "react-redux";

import {
  Context,
  PauseFrame,
  getSelectedFrameId,
} from "devtools/client/debugger/src/reducers/pause";
import { EditPointBehavior } from "replay-next/src/contexts/PointsContext";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  POINT_BEHAVIOR,
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
import styles from "./Breakpoint.module.css";

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
  editable: boolean;
  onEditPointBehavior: EditPointBehavior;
  onRemoveBreakpoint: (cx: Context, point: Point) => void;
  point: Point;
  shouldBreak: POINT_BEHAVIOR;
  shouldLog: POINT_BEHAVIOR;
  type: "logpoint" | "breakpoint";
}
type BreakpointProps = PropsFromRedux & PropsFromParent & { replayClient: ReplayClientInterface };

class Breakpoint extends PureComponent<BreakpointProps> {
  get selectedLocation(): Location {
    const { point } = this.props;

    return {
      column: point.columnIndex,
      line: point.lineNumber,
      sourceId: point.sourceId,
    };
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
    const { point } = this.props;
    const { columnIndex, lineNumber } = point;

    const columnVal = columnIndex != null ? `:${columnIndex}` : "";
    const location = `${lineNumber}${columnVal}`;

    return (
      <div className={styles.Location} data-test-name="PointLocation">
        {location}
      </div>
    );
  }

  render() {
    const {
      cx,
      editable,
      replayClient,
      onEditPointBehavior,
      onRemoveBreakpoint,
      point,
      shouldBreak,
      shouldLog,
      type,
      selectedFrameId,
      sourcesState,
    } = this.props;
    const frame = selectedFrameId
      ? getPauseFrameSuspense(replayClient, selectedFrameId, sourcesState)
      : undefined;

    const behavior = type === "breakpoint" ? shouldBreak : shouldLog;
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
        onEditPointBehavior(point.id, {
          shouldBreak: behavior,
          shouldLog,
        });
      } else {
        onEditPointBehavior(point.id, {
          shouldBreak,
          shouldLog: behavior,
        });
      }
    };

    const onCloseButtonClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (type === "breakpoint") {
        if (shouldLog === POINT_BEHAVIOR_ENABLED) {
          onEditPointBehavior(point.id, {
            shouldBreak: POINT_BEHAVIOR_DISABLED,
            shouldLog,
          });
        } else {
          onRemoveBreakpoint(cx, point);
        }
      } else {
        if (shouldBreak === POINT_BEHAVIOR_ENABLED) {
          onEditPointBehavior(point.id, {
            shouldBreak,
            shouldLog: POINT_BEHAVIOR_DISABLED,
          });
        } else {
          onRemoveBreakpoint(cx, point);
        }
      }
    };

    return (
      <div
        className={styles.Point}
        data-test-name="Breakpoint"
        data-test-type={type}
        data-test-column-index={point.columnIndex}
        data-test-line-number={point.lineNumber}
        data-test-state={this.isCurrentlyPausedAtBreakpoint(frame) ? "paused" : undefined}
        data-test-source-id={point.sourceId}
        onClick={this.selectBreakpoint}
      >
        <label
          data-test-name="BreakpointToggle"
          data-test-state={isChecked ? POINT_BEHAVIOR_ENABLED : POINT_BEHAVIOR_DISABLED_TEMPORARILY}
          onClick={onCheckboxClick}
        >
          <Checkbox checked={isChecked} onChange={onCheckboxChange} />
        </label>
        <BreakpointOptions breakpoint={point} type={type} />
        {this.renderSourceLocation()}
        {editable && (
          <CloseButton handleClick={onCloseButtonClick} tooltip={"Remove this breakpoint"} />
        )}
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
