import { Loggable } from "@bvaughn/components/console/hooks/useFilteredMessagesDOM";
import { PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { Message as ProtocolMessage } from "@replayio/protocol";

import { EventTypeLog } from "../suspense/EventsCache";

export function isEventTypeLog(loggable: Loggable): loggable is EventTypeLog {
  return (
    loggable.hasOwnProperty("data") &&
    loggable.hasOwnProperty("frameworkListeners") &&
    loggable.hasOwnProperty("values")
  );
}

export function isPointInstance(loggable: Loggable): loggable is PointInstance {
  return loggable.hasOwnProperty("timeStampedHitPoint") && loggable.hasOwnProperty("point");
}

export function isProtocolMessage(loggable: Loggable): loggable is ProtocolMessage {
  return !loggable.hasOwnProperty("timeStampedHitPoint") || !loggable.hasOwnProperty("point");
}
