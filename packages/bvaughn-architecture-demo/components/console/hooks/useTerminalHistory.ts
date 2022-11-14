import { RecordingId } from "@replayio/protocol";
import { useCallback } from "react";

import useLocalStorage from "bvaughn-architecture-demo/src/hooks/useLocalStorage";

export default function useTerminalHistory(
  recordingId: RecordingId,
  maxHistoryLength: number = 20
): [expressionHistory: string[], addExpression: (value: string) => void] {
  const [expressionHistory, setExpressionHistory] = useLocalStorage<string[]>(
    `${recordingId}::expressionHistory`,
    []
  );

  const addExpression = useCallback<(value: string) => void>(
    (command: string) => {
      setExpressionHistory(prevHistory => {
        const newHistory =
          prevHistory.length >= maxHistoryLength
            ? [...prevHistory.slice(1), command]
            : [...prevHistory, command];
        return newHistory;
      });
    },
    [maxHistoryLength, setExpressionHistory]
  );

  return [expressionHistory, addExpression];
}
