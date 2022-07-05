import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { LogPointInstance, LogPointsContext } from "@bvaughn/src/contexts/LogPointsContext";
import { getCachedAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import { isLogPointInstance } from "@bvaughn/src/utils/console";
import { Message as ProtocolMessage, Value as ProtocolValue } from "@replayio/protocol";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFocusRange from "./useFocusRange";

export type Loggable = ProtocolMessage | LogPointInstance;

export default function useFilteredMessages(): Loggable[] {
  const client = useContext(ReplayClientContext);
  const logPoints = useContext(LogPointsContext);
  const { filterByText, levelFlags } = useContext(ConsoleFiltersContext);

  const focusRange = useFocusRange();

  const filterByTextLowercase = filterByText.toLowerCase();

  // If there is filterByText, it should apply to log points also.
  // We can only filter log points that either require no analysis or have already been analyzed.
  const filteredLogPoints = useMemo<LogPointInstance[]>(() => {
    if (filterByTextLowercase === "") {
      return logPoints;
    }

    return logPoints.filter(logPoint => {
      const analysis = getCachedAnalysis(
        logPoint.point.location,
        logPoint.timeStampedHitPoint,
        logPoint.point.content
      );

      if (!analysis) {
        // TRICKY
        // If we haven't run analysis on the point yet, we don't know whether it should be filtered or not.
        // Leave it in the filtered list so that it will load new data (Suspend) then we'll re-evaluate.
        return true;
      }

      // TODO (point) Do better filtering for non-string values
      return (
        analysis.values.find((value: any) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(filterByTextLowercase);
          } else if (typeof value?.value === "string") {
            return value?.value?.toLowerCase()?.includes(filterByTextLowercase);
          }
        }) != null
      );
    });
  }, [filterByTextLowercase, logPoints]);

  const { messages } = getMessages(client, focusRange);

  // Filter in-focus messages by the current criteria.
  const filteredMessages = useMemo<ProtocolMessage[]>(() => {
    const { showErrors, showLogs, showWarnings } = levelFlags;
    if (showErrors && showLogs && showWarnings && filterByTextLowercase === "") {
      return messages;
    } else {
      return messages.filter((message: ProtocolMessage) => {
        switch (message.level) {
          case "warning": {
            if (!showWarnings) {
              return false;
            }
            break;
          }
          case "error": {
            if (!showErrors) {
              return false;
            }
            break;
          }
          default: {
            if (!showLogs) {
              return false;
            }
            break;
          }
        }

        if (filterByTextLowercase !== "") {
          // TODO This is a hacky partial implementation of filter by text.
          if (message.text && message.text.toLowerCase().includes(filterByTextLowercase)) {
            return true;
          } else {
            if (message.argumentValues) {
              return message.argumentValues.find((argumentValue: ProtocolValue) => {
                if (
                  argumentValue.value &&
                  `${argumentValue.value}`.toLowerCase().includes(filterByTextLowercase)
                ) {
                  return true;
                }
              });
            }
          }

          return false;
        }

        return true;
      });
    }
  }, [filterByTextLowercase, levelFlags, messages]);

  const sortedLoggables = useMemo<Loggable[]>(() => {
    const loggables: Loggable[] = [...filteredLogPoints, ...filteredMessages];

    return loggables.sort((a: Loggable, b: Loggable) => {
      const pointA = isLogPointInstance(a) ? a.timeStampedHitPoint.point : a.point.point;
      const pointB = isLogPointInstance(b) ? b.timeStampedHitPoint.point : b.point.point;
      return pointA.localeCompare(pointB);
    });
  }, [filteredLogPoints, filteredMessages]);

  return sortedLoggables;
}
