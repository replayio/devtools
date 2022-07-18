import { Loggable } from "@bvaughn/components/console/hooks/useFilteredMessagesDOM";
import { LogPointInstance } from "@bvaughn/src/contexts/LogPointsContext";
import { Message as ProtocolMessage } from "@replayio/protocol";

import { EventTypeLog } from "../suspense/EventsCache";

export function isEventTypeLog(loggable: Loggable): loggable is EventTypeLog {
  return (
    loggable.hasOwnProperty("data") &&
    loggable.hasOwnProperty("frameworkListeners") &&
    loggable.hasOwnProperty("values")
  );
}

export function isLogPointInstance(loggable: Loggable): loggable is LogPointInstance {
  return loggable.hasOwnProperty("timeStampedHitPoint") && loggable.hasOwnProperty("point");
}

export function isProtocolMessage(loggable: Loggable): loggable is ProtocolMessage {
  return !loggable.hasOwnProperty("timeStampedHitPoint") || !loggable.hasOwnProperty("point");
}
