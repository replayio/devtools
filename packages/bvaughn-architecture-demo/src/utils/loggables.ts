import { Loggable } from "@bvaughn/components/console/LoggablesContext";
import { ExecutionPoint } from "@replayio/protocol";
import { isEventTypeLog, isPointInstance, isProtocolMessage, isTerminalExpression } from "./console";

export function getExecutionPointForSort(loggable: Loggable): ExecutionPoint {
  if (isEventTypeLog(loggable)) {
    return loggable.point;
  } else if (isPointInstance(loggable)) {
    return loggable.timeStampedHitPoint.point;
  } else if (isProtocolMessage(loggable)) {
    return loggable.point.point;
  } else if (isTerminalExpression(loggable)) {
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
  } else if (isTerminalExpression(loggable)) {
    return loggable.time;
  } else {
    throw Error("Unsupported loggable type");
  }
}

export function loggableSort(a: Loggable, b: Loggable): number {
  const aPoint = getExecutionPointForSort(a);
  const bPoint = getExecutionPointForSort(b);

  // Terminal messages may be logged at the same point/time as other loggables.
  // If this happens, TerminalExpressions should always come last.
  if (aPoint === bPoint) {
    const aIsTerminalExpression = isTerminalExpression(a);
    const bIsTerminalExpression = isTerminalExpression(b);
    if (aIsTerminalExpression && bIsTerminalExpression) {
      // Two terminal messages at the same time can be sorted by the order they were added in.
      return a.id - b.id;
    } else if (aIsTerminalExpression) {
      return 1;
    } else if (bIsTerminalExpression) {
      return -1;
    }
  }

  return aPoint.localeCompare(bPoint);
}
