import { Suspense, useContext, useEffect, useMemo, useState } from "react";

import { getSelectedDomNodeId } from "devtools/client/inspector/markup/reducers/markup";
import { getSelectedNodeId } from "devtools/client/inspector/markup/selectors/markup";
import { onViewSourceInDebugger } from "devtools/client/webconsole/actions/toolbox";
import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getNodeEventListeners } from "ui/actions/event-listeners";
import {
  EventListenerWithFunctionInfo,
  NodeWithPreview,
} from "ui/actions/eventListeners/eventListenerUtils";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { ExpandableItem } from "./ExpandableItem";
import { XHTMLNode } from "./XHTMLNode";

export function EventListenersApp() {
  const selectedNodeId = useAppSelector(getSelectedNodeId);

  return (
    <InlineErrorBoundary name="EventListeners" resetKey={selectedNodeId ?? undefined}>
      <Suspense fallback={<PanelLoader />}>
        <EventListenersAppSuspends />
      </Suspense>
    </InlineErrorBoundary>
  );
}

function EventListenersAppSuspends() {
  const [listeners, setListeners] = useState<EventListenerWithFunctionInfo[]>([]);
  const selectedDomNodeId = useAppSelector(getSelectedDomNodeId);
  const dispatch = useAppDispatch();
  const { pauseId } = useMostRecentLoadedPause() ?? {};
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
  const nodeWithPreview = objectCache.read(
    replayClient,
    pauseId,
    selectedDomNodeId,
    "canOverflow"
  ) as NodeWithPreview;

  return (
    <div className="h-full overflow-auto">
      {listeners.length === 0 ? (
        <div className="devtools-sidepanel-no-result">No event listeners</div>
      ) : (
        groupedSortedListeners.map(([eventType, listeners]) => {
          const framework = listeners.find(l => !!l.framework)?.framework;
          // Add either a "Framework" icon (like the React logo) or a "JS" icon
          // to the event name expanders in the treeview
          const header = (
            <div className="flex items-center text-sm">
              {eventType}
              <span className={`img ml-1 ${framework ?? "javascript"}`}></span>
            </div>
          );
          return (
            <div key={eventType} className="devtools-monospace">
              <ExpandableItem header={header}>
                {listeners.map(
                  (
                    { functionName, functionParameterNames, locationUrl, location, framework },
                    i
                  ) => {
                    return (
                      <ExpandableItem
                        key={i}
                        header={
                          <div className="flex flex-col ">
                            <XHTMLNode node={nodeWithPreview} />
                            <div>
                              {location && locationUrl ? (
                                <span
                                  className="cursor-pointer underline hover:text-gray-500"
                                  title="Open in Debugger"
                                  onClick={() => {
                                    dispatch(
                                      onViewSourceInDebugger({
                                        column: location.column,
                                        line: location.line,
                                        openSource: true,
                                        sourceId: location.sourceId,
                                      })
                                    );
                                  }}
                                >
                                  {locationUrl.substring(locationUrl.lastIndexOf("/") + 1)}:
                                  {location.line}
                                </span>
                              ) : (
                                "[native code]"
                              )}
                            </div>
                          </div>
                        }
                      >
                        <div className="pl-4">
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
          );
        })
      )}
    </div>
  );
}
