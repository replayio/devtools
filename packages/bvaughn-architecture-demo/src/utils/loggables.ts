import { Loggable } from "@bvaughn/components/console/LoggablesContext";
import { ExecutionPoint } from "@replayio/protocol";
import { isEventTypeLog, isPointInstance, isProtocolMessage, isTerminalMessage } from "./console";

export function getExecutionPointForSort(loggable: Loggable): ExecutionPoint {
  if (isEventTypeLog(loggable)) {
    return loggable.point;
  } else if (isPointInstance(loggable)) {
    return loggable.timeStampedHitPoint.point;
  } else if (isProtocolMessage(loggable)) {
    return loggable.point.point;
  } else if (isTerminalMessage(loggable)) {
    return loggable.point;
  } else {
    throw Error("Unsupported loggable type");
  }
}

export function getTimeForSort(loggable: Loggable): number {
  if (isEventTypeLog(loggable)) {
    return loggable.time;
  } else if (isPointInstance(loggable)) {
    return loggable.timeStampedHitPoint.time;
  } else if (isProtocolMessage(loggable)) {
    return loggable.point.time;
  } else if (isTerminalMessage(loggable)) {
    return loggable.time;
  } else {
    throw Error("Unsupported loggable type");
  }
}

export function loggableSort(a: Loggable, b: Loggable): number {
  const aPoint = getExecutionPointForSort(a);
  const bPoint = getExecutionPointForSort(b);

  // Terminal messages may be logged at the same point/time as other loggables.
  // If this happens, TerminalMessages should always come last.
  if (aPoint === bPoint) {
    const aIsTerminalMessage = isTerminalMessage(a);
    const bIsTerminalMessage = isTerminalMessage(b);
    if (aIsTerminalMessage && bIsTerminalMessage) {
      // Two terminal messages at the same time can be sorted by the order they were added in.
      return a.id - b.id;
    } else if (aIsTerminalMessage) {
      return 1;
    } else if (bIsTerminalMessage) {
      return -1;
    }
  }

  return aPoint.localeCompare(bPoint);
}
