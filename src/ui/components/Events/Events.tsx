import classNames from "classnames";
import sortedLastIndex from "lodash/sortedLastIndex";
import { ConnectedProps, connect } from "react-redux";

import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { trackEvent } from "ui/utils/telemetry";

import Event from "./Event";

function CurrentTimeLine({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={classNames("m-0", isActive ? "bg-secondaryAccent" : "bg-transparent")}
      style={{ height: "2px" }}
    />
  );
}

function Events({ currentTime, events, executionPoint, seek }: PropsFromRedux) {
  const onSeek = (point: string, time: number) => {
    trackEvent("events_timeline.select");
    seek(point, time, false);
  };

  const currentEventIndex = sortedLastIndex(
    events.map(e => e.time),
    currentTime
  );
  if (events.length > 0) {
    return (
      <div className="bg-bodyBgcolor py-1.5 text-xs">
        {events.map((e, i) => {
          return (
            <div key={e.point}>
              <CurrentTimeLine isActive={currentEventIndex === i} />
              <div className="px-1.5">
                <Event
                  onSeek={onSeek}
                  event={e}
                  currentTime={currentTime}
                  executionPoint={executionPoint}
                />
              </div>
            </div>
          );
        })}
        <CurrentTimeLine isActive={currentEventIndex === events.length && !!events.length} />
      </div>
    );
  } else {
    return null;
  }
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    events: selectors.getFlatEvents(state),
    executionPoint: getExecutionPoint(state),
  }),
  { seek: actions.seek }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Events);
