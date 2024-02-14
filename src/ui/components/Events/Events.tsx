import classNames from "classnames";
import sortedLastIndex from "lodash/sortedLastIndex";
import React, { memo, useContext, useMemo } from "react";
import { STATUS_PENDING, STATUS_RESOLVED, useImperativeCacheValue } from "suspense";

import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { RecordedEvent } from "protocol/RecordedEventsCache";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { seek } from "ui/actions/timeline";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  ParsedJumpToCodeAnnotation,
  eventListenersJumpLocationsCache,
} from "ui/suspense/annotationsCaches";
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

function Events({ events }: { events: RecordedEvent[] }) {
  const client = useContext(ReplayClientContext);
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const executionPoint = useAppSelector(getExecutionPoint);
  const { range: focusWindow } = useContext(FocusContext);

  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    eventListenersJumpLocationsCache,
    client
  );

  const [filters] = useGraphQLUserData("console_eventFilters");

  const filteredEvents = useMemo(
    () =>
      events.filter(event => {
        if (
          focusWindow &&
          !isExecutionPointsWithinRange(event.point, focusWindow.begin.point, focusWindow.end.point)
        ) {
          return false;
        }

        switch (event.kind) {
          case "keypress":
            return filters.keyboard !== false;
          case "mousedown":
            return filters.mouse !== false;
          case "navigation":
            return filters.navigation !== false;
        }

        return false;
      }),
    [events, filters, focusWindow]
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

  const onSeek = (executionPoint: string, time: number) => {
    trackEvent("events_timeline.select");
    dispatch(seek({ executionPoint, openSource: false, time }));
  };

  const currentEventIndex = sortedLastIndex(
    filteredEvents.map(event => event.time),
    currentTime
  );

  let content: React.ReactNode = null;

  if (filteredEvents.length > 0) {
    content = (
      <>
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
      </>
    );
  }

  return (
    <div className="bg-bodyBgcolor py-1.5 text-xs" data-test-name="EventsList">
      {content}
    </div>
  );
}

export default memo(Events);
