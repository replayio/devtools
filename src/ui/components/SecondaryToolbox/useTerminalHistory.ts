import { RecordingId } from "@replayio/protocol";
import useLocalStorage from "bvaughn-architecture-demo/src/hooks/useLocalStorage";
import { useCallback } from "react";

export default function useTerminalHistory(
  recordingId: RecordingId,
  maxHistoryLength: number = 20
): [string[], (value: string) => void] {
  const [terminalExpressionHistory, setTerminalExpressionHistory] = useLocalStorage<string[]>(
    `${recordingId}::terminalExpressionHistory`,
    []
  );

  const setTerminalExpressionHistoryWrapper = useCallback<(value: string) => void>(
    (command: string) => {
      setTerminalExpressionHistory(prevHistory => {
        const newHistory =
          prevHistory.length >= maxHistoryLength
            ? [...prevHistory.slice(1), command]
            : [...prevHistory, command];
        return newHistory;
      });
    },
    [maxHistoryLength, setTerminalExpressionHistory]
  );

  return [terminalExpressionHistory, setTerminalExpressionHistoryWrapper];
}
