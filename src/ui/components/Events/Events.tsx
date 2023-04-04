import classNames from "classnames";
import sortedLastIndex from "lodash/sortedLastIndex";
import { memo, useMemo } from "react";

import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getFilteredEventsForFocusRegion } from "ui/actions/app";
import { seek } from "ui/actions/timeline";
import useEventsPreferences from "ui/components/Events/useEventsPreferences";
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

  const { filters } = useEventsPreferences();

  const filteredEvents = useMemo(
    () =>
      events.filter(event => {
        switch (event.kind) {
          case "keydown":
          case "keyup":
          case "keypress":
            return filters.keyboard !== false;
          case "mousedown":
            return filters.mouse !== false;
          case "navigation":
            return filters.navigation !== false;
        }

        return true;
      }),
    [events, filters]
  );

  const onSeek = (point: string, time: number) => {
    trackEvent("events_timeline.select");
    dispatch(seek(point, time, false));
  };

  const currentEventIndex = sortedLastIndex(
    filteredEvents.map(event => event.time),
    currentTime
  );

  if (filteredEvents.length > 0) {
    return (
      <div className="bg-bodyBgcolor py-1.5 text-xs">
        {filteredEvents.map((event, index) => {
          return (
            <div key={event.point}>
              <CurrentTimeLine isActive={currentEventIndex === index} />
              <div className="px-1.5">
                <Event
                  onSeek={onSeek}
                  event={event}
                  currentTime={currentTime}
                  executionPoint={executionPoint!}
                />
              </div>
            </div>
          );
        })}
        <CurrentTimeLine
          isActive={currentEventIndex === filteredEvents.length && !!filteredEvents.length}
        />
      </div>
    );
  } else {
    return null;
  }
}

export default memo(Events);
