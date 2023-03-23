import classNames from "classnames";
import sortedLastIndex from "lodash/sortedLastIndex";
import React from "react";

import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getFilteredEventsForFocusRegion } from "ui/actions/app";
import { seek } from "ui/actions/timeline";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import Event from "./Event";

export function CurrentTimeLine({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={classNames("m-0", isActive ? "bg-secondaryAccent" : "bg-transparent")}
      style={{ height: "2px" }}
    />
  );
}

function Events() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const events = useAppSelector(getFilteredEventsForFocusRegion);

  const onSeek = (point: string, time: number) => {
    trackEvent("events_timeline.select");
    dispatch(seek(point, time, false));
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
                  executionPoint={executionPoint!}
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

export default React.memo(Events);
