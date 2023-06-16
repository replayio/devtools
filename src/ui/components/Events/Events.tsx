import classNames from "classnames";
import sortedLastIndex from "lodash/sortedLastIndex";
import { memo, useContext, useMemo } from "react";
import { STATUS_PENDING, STATUS_RESOLVED, useImperativeCacheValue } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getFilteredEventsForFocusWindow } from "ui/actions/app";
import { seek } from "ui/actions/timeline";
import useEventsPreferences from "ui/components/Events/useEventsPreferences";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { ParsedJumpToCodeAnnotation } from "ui/suspense/annotationsCaches";
import { eventListenersJumpLocationsCache } from "ui/suspense/annotationsCaches";
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

const NO_ANNOTATIONS: ParsedJumpToCodeAnnotation[] = [];

function Events() {
  const client = useContext(ReplayClientContext);
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const events = useAppSelector(getFilteredEventsForFocusWindow);

  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    eventListenersJumpLocationsCache,
    client
  );

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

  const jumpToCodeAnnotations: ParsedJumpToCodeAnnotation[] =
    annotationsStatus === STATUS_RESOLVED ? parsedAnnotations : NO_ANNOTATIONS;

  const jumpToCodeEntriesPerEvent = useMemo(() => {
    const jumpToCodeEntriesByPoint: Record<string, ParsedJumpToCodeAnnotation> = {};

    for (const jumpToCodeAnnotation of jumpToCodeAnnotations) {
      jumpToCodeEntriesByPoint[jumpToCodeAnnotation.point] = jumpToCodeAnnotation;
    }

    return jumpToCodeEntriesByPoint;
  }, [jumpToCodeAnnotations]);

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
                  jumpToCodeAnnotation={jumpToCodeEntriesPerEvent[event.point]}
                  jumpToCodeLoadingStatus={
                    annotationsStatus === STATUS_PENDING ? "loading" : "complete"
                  }
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
