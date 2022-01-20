import { NodeFront, WiredEventListener } from "protocol/thread/node";
import React, { FC, useEffect, useState } from "react";

type EventListenersAppProps = {};

export const EventListenersApp: FC<EventListenersAppProps> = () => {
  const [listeners, setListeners] = useState<WiredEventListener[]>([]);

  useEffect(() => {
    if (!gToolbox) {
      return;
    }

    const handler = async (node: NodeFront | null) => {
      if (!node) {
        return;
      }
      const listeners = await node.getEventListeners();
      setListeners(listeners ?? []);
    };

    window.gToolbox.selection.on("new-node-front", handler);
    window.gToolbox.selection.on("detached-front", handler);

    return () => {
      window.gToolbox.selection.off("new-node-front", handler);
      window.gToolbox.selection.off("detached-front", handler);
    };
  }, []);

  return (
    <div>
      {listeners.map(listener => (
        <div key={listener.handler.id()}>{listener.handler.functionName()}</div>
      ))}
    </div>
  );
};
