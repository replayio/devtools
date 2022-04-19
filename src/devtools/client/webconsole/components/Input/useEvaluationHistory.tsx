import clamp from "lodash/clamp";
import { useState } from "react";
import { useSelector } from "react-redux";

import { getCommandHistory } from "../../selectors/messages";

export default function useEvaluationHistory(setValue: (newValue: string) => void) {
  const commandHistory = useSelector(getCommandHistory);
  const [index, setIndex] = useState<number>(0);

  const moveHistoryCursor = (difference: -1 | 1) => {
    if (commandHistory.length > 0) {
      const newIndex = clamp(index + difference, 0, commandHistory.length);

      setValue(["", ...commandHistory][newIndex]);
      setIndex(newIndex);
    }
  };

  return { moveHistoryCursor, setHistoryIndex: setIndex };
}
