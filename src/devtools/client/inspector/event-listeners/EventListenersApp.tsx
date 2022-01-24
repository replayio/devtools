import { FrameworkEventListener } from "protocol/event-listeners";
import { NodeFront, WiredEventListener } from "protocol/thread/node";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { ExpandableItem } from "./ExpandableItem";
import { XHTMLNode } from "./XHTMLNode";

type AnyListener = WiredEventListener | FrameworkEventListener;

export const EventListenersApp: FC = () => {
  const selectedNode = useRef<NodeFront | null>(null);
  const [listeners, setListeners] = useState<AnyListener[]>([]);

  useEffect(() => {
    if (!gToolbox) {
      return;
    }

    const handler = async (node: NodeFront | null) => {
      selectedNode.current = node;

      if (!node) {
        setListeners([]);
        return;
      }

      const listeners = (await node.getEventListeners()) ?? [];
      const fwListeners = await node.getFrameworkEventListeners();
      setListeners([...listeners, ...fwListeners]);
    };

    // try getting listeners of the current selection
    const nodeFront = gToolbox.selection.nodeFront;
    if (!!nodeFront) {
      handler(nodeFront);
    }

    // in either case, subscribe to changes to the selection
    window.gToolbox.selection.on("new-node-front", handler);
    window.gToolbox.selection.on("detached-front", handler);

    return () => {
      window.gToolbox.selection.off("new-node-front", handler);
      window.gToolbox.selection.off("detached-front", handler);
    };
  }, []);

  const groupedSortedListeners: [string, AnyListener[]][] = useMemo(() => {
    // group listenerss by event type
    const groups: Record<string, AnyListener[]> = {};
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

  const currentNode = selectedNode.current;

  if (!currentNode) {
    return null;
  }

  return (
    <div className="h-full overflow-auto">
      {listeners.length === 0 ? (
        <div className="devtools-sidepanel-no-result">No event listeners</div>
      ) : (
        groupedSortedListeners.map(([eventType, listeners]) => (
          <div key={eventType} className="devtools-monospace">
            <ExpandableItem header={eventType}>
              {listeners.map(({ handler, capture }) => {
                const location = handler.functionLocation();
                const locationUrl = handler.functionLocationURL();
                const functionName = handler.functionName() ?? "";
                const paramsNames = handler.functionParameterNames() ?? [];

                return (
                  <ExpandableItem
                    key={handler.id()}
                    header={
                      <div className="flex gap-2">
                        <XHTMLNode node={currentNode} />
                        <span>
                          {location && locationUrl ? (
                            <span
                              className="underline cursor-pointer hover:text-gray-500"
                              title="Open in Debugger"
                              onClick={() => {
                                gToolbox.viewSourceInDebugger(
                                  locationUrl,
                                  location.line,
                                  location.column,
                                  location.sourceId
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
                          {functionName}({paramsNames.join(", ")})
                        </span>
                      </div>
                    </div>
                  </ExpandableItem>
                );
              })}
            </ExpandableItem>
          </div>
        ))
      )}
    </div>
  );
};
