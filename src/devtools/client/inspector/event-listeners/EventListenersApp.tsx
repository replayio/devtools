import { NodeFront, WiredEventListener } from "protocol/thread/node";
import React, { FC, useEffect, useMemo, useState } from "react";

type EventListenersAppProps = {};

export const EventListenersApp: FC<EventListenersAppProps> = () => {
  const [listeners, setListeners] = useState<WiredEventListener[]>([]);

  useEffect(() => {
    if (!gToolbox) {
      return;
    }

    const handler = async (node: NodeFront | null) => {
      if (!node) {
        setListeners([]);
        return;
      }
      const listeners = await node.getEventListeners();
      setListeners(listeners ?? []);
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

  const groupedListeners: Record<string, WiredEventListener[]> = useMemo(() => {
    const groups: Record<string, WiredEventListener[]> = {};
    for (const listener of listeners) {
      if (groups[listener.type] === undefined) {
        groups[listener.type] = [];
      }
      groups[listener.type].push(listener);
    }
    return groups;
  }, [listeners]);

  /*

  event type
    node (remove) location in files
      useCapture: bool
      passive: bool
      once: bool
      handler _ summary
        [[Scopes]]
        [[Prototype]]
        [[FunctionLocation]]
        caller (...) (click to eval)
        argument (...) (click to eval)
        prototype
          [[Prototype]]
          constructor
        name
        length
  */

  console.log(groupedListeners);

  return (
    <div>
      {listeners.length === 0 ? (
        <div className="devtools-sidepanel-no-result">No event listeners</div>
      ) : (
        Object.entries(groupedListeners).map(([eventType, listeners]) => (
          <div key={eventType}>
            {eventType}
            {listeners.map(listener => (
              <div key={listener.handler.id()}>{43}</div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};
