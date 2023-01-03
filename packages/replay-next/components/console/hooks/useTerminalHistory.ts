import { RecordingId } from "@replayio/protocol";
import { useCallback } from "react";

import { CONSOLE_SETTINGS_DATABASE } from "replay-next/src/contexts/ConsoleFiltersContext";
import useIndexedDB from "replay-next/src/hooks/useIndexedDB";

export default function useTerminalHistory(
  recordingId: RecordingId,
  maxHistoryLength: number = 20
): [expressionHistory: string[], addExpression: (value: string) => void] {
  const { value: expressionHistory, setValue: setExpressionHistory } = useIndexedDB<string[]>({
    database: CONSOLE_SETTINGS_DATABASE,
    initialValue: [],
    recordName: recordingId,
    storeName: "terminalHistory",
  });

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
