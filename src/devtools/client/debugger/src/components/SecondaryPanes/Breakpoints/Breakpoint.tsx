import { Location } from "@replayio/protocol";
import { ChangeEvent, PureComponent, Suspense, useContext } from "react";
import { MouseEvent } from "react";
import { ConnectedProps, connect } from "react-redux";

import {
  Context,
  PauseFrame,
  getSelectedFrameId,
} from "devtools/client/debugger/src/reducers/pause";
import AvatarImage from "replay-next/components/AvatarImage";
import { EditPointBehavior } from "replay-next/src/contexts/points/types";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  POINT_BEHAVIOR,
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_DISABLED_TEMPORARILY,
  POINT_BEHAVIOR_ENABLED,
  Point,
  ReplayClientInterface,
} from "shared/client/types";
import { UserInfo } from "shared/graphql/types";
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
  currentUserInfo: UserInfo | null;
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
    return this.props.point.location;
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
    const { column, line } = point.location;

    const columnVal = column != null ? `:${column}` : "";
    const location = `${line}${columnVal}`;

    return (
      <div className={styles.Location} data-private data-test-name="PointLocation">
        {location}
      </div>
    );
  }

  render() {
    const {
      currentUserInfo,
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
    const onLabelClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const createdByCurrentUser = point.user?.id === currentUserInfo?.id;

    const onCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
      const behavior = event.target.checked
        ? POINT_BEHAVIOR_ENABLED
        : POINT_BEHAVIOR_DISABLED_TEMPORARILY;

      if (type === "breakpoint") {
        onEditPointBehavior(
          point.key,
          {
            shouldBreak: behavior,
          },
          createdByCurrentUser
        );
      } else {
        onEditPointBehavior(
          point.key,
          {
            shouldLog: behavior,
          },
          createdByCurrentUser
        );
      }
    };

    const onCloseButtonClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (type === "breakpoint") {
        if (shouldLog === POINT_BEHAVIOR_ENABLED) {
          onEditPointBehavior(
            point.key,
            {
              shouldBreak: POINT_BEHAVIOR_DISABLED,
            },
            createdByCurrentUser
          );
        } else {
          onRemoveBreakpoint(cx, point);
        }
      } else {
        if (shouldBreak === POINT_BEHAVIOR_ENABLED) {
          onEditPointBehavior(
            point.key,
            {
              shouldLog: POINT_BEHAVIOR_DISABLED,
            },
            createdByCurrentUser
          );
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
        data-test-column-index={point.location.column}
        data-test-line-number={point.location.line}
        data-test-state={this.isCurrentlyPausedAtBreakpoint(frame) ? "paused" : undefined}
        data-test-source-id={point.location.sourceId}
        onClick={this.selectBreakpoint}
      >
        <label
          data-test-name="BreakpointToggle"
          data-test-state={isChecked ? POINT_BEHAVIOR_ENABLED : POINT_BEHAVIOR_DISABLED_TEMPORARILY}
          onClick={onLabelClick}
        >
          <Checkbox checked={isChecked} onChange={onCheckboxChange} />
        </label>
        <BreakpointOptions breakpoint={point} type={type} />
        {this.renderSourceLocation()}
        {editable ? (
          <CloseButton
            dataTestName="RemoveBreakpointButton"
            handleClick={onCloseButtonClick}
            tooltip={"Remove this breakpoint"}
          />
        ) : (
          <AvatarImage
            className={styles.CreatedByAvatar}
            name={point.user?.name || undefined}
            src={point.user?.picture || undefined}
            title={point.user?.name || undefined}
          />
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
