import React, { useEffect, useMemo, useContext, useState } from "react";

import {
  getNodeEventListeners,
  EventListenerWithFunctionInfo,
  NodeWithPreview,
} from "ui/actions/event-listeners";
import { getPauseId } from "devtools/client/debugger/src/reducers/pause";

import { useAppDispatch } from "ui/setup/hooks";
import { ExpandableItem } from "./ExpandableItem";
import { XHTMLNode } from "./XHTMLNode";
import { onViewSourceInDebugger } from "devtools/client/webconsole/actions/toolbox";
import { useAppSelector } from "ui/setup/hooks";
import { getSelectedDomNodeId } from "devtools/client/inspector/markup/reducers/markup";
import { getObjectWithPreview } from "@bvaughn/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export const EventListenersApp = () => {
  const [listeners, setListeners] = useState<EventListenerWithFunctionInfo[]>([]);
  const selectedDomNodeId = useAppSelector(getSelectedDomNodeId);
  const dispatch = useAppDispatch();
  const pauseId = useAppSelector(getPauseId);
  const replayClient = useContext(ReplayClientContext);

  useEffect(() => {
    if (!selectedDomNodeId) {
      return;
    }

    dispatch(getNodeEventListeners(selectedDomNodeId)).then(eventListeners =>
      setListeners(eventListeners)
    );
  }, [selectedDomNodeId, dispatch]);

  const groupedSortedListeners: [string, EventListenerWithFunctionInfo[]][] = useMemo(() => {
    const groups: Record<string, EventListenerWithFunctionInfo[]> = {};
    for (const listener of listeners) {
      if (groups[listener.type] === undefined) {
        groups[listener.type] = [];
      }

      groups[listener.type].push(listener);
    }

    // sort groups of listeners by event type name
    return Object.entries(groups).sort(([eventA], [eventB]) => {
      if (eventA < eventB) {
        return -1;
      }
      if (eventA > eventB) {
        return 1;
      }
      return 0;
    });
  }, [listeners]);

  if (!pauseId || !selectedDomNodeId) {
    return null;
  }

  // Suspend until we have the data for the node, which we _should_
  const nodeWithPreview = getObjectWithPreview(
    replayClient,
    pauseId,
    selectedDomNodeId
  ) as NodeWithPreview;

  return (
    <div className="h-full overflow-auto">
      {listeners.length === 0 ? (
        <div className="devtools-sidepanel-no-result">No event listeners</div>
      ) : (
        groupedSortedListeners.map(([eventType, listeners]) => (
          <div key={eventType} className="devtools-monospace">
            <ExpandableItem header={eventType}>
              {listeners.map(
                ({ functionName, functionParameterNames, locationUrl, location, capture }, i) => {
                  return (
                    <ExpandableItem
                      key={i}
                      header={
                        <div className="flex gap-2">
                          <XHTMLNode node={nodeWithPreview} />
                          <span>
                            {location && locationUrl ? (
                              <span
                                className="cursor-pointer underline hover:text-gray-500"
                                title="Open in Debugger"
                                onClick={() => {
                                  dispatch(
                                    onViewSourceInDebugger(
                                      {
                                        ...location,
                                        url: locationUrl,
                                      },
                                      true
                                    )
                                  );
                                }}
                              >
                                {locationUrl.substring(locationUrl.lastIndexOf("/") + 1)}:
                                {location.line}
                              </span>
                            ) : (
                              "[native code]"
                            )}
                          </span>
                        </div>
                      }
                    >
                      <div className="pl-4">
                        <div className="theme-fg-color3">
                          useCapture:{" "}
                          <span className="theme-fg-color1">{capture ? "true" : "false"}</span>
                        </div>
                        <div>
                          <span className="theme-fg-color3">handler: </span>
                          <span
                            className="italic"
                            style={{
                              color: "var(--theme-highlight-lightorange)",
                            }}
                          >
                            f
                          </span>{" "}
                          <span className="italic">
                            {functionName}({functionParameterNames.join(", ")})
                          </span>
                        </div>
                      </div>
                    </ExpandableItem>
                  );
                }
              )}
            </ExpandableItem>
          </div>
        ))
      )}
    </div>
  );
};
