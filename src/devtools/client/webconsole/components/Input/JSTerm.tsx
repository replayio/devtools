import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import actions from "devtools/client/webconsole/actions/index";
import { useDispatch, useSelector } from "react-redux";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getFrameScope } from "devtools/client/debugger/src/reducers/pause";
import { getCommandHistory } from "../../selectors/messages";
import {
  getAutocompleteMatches,
  getCursorIndex,
  insertAutocompleteMatch,
} from "../../utils/autocomplete";
import Autocomplete from "./Autocomplete";
import { UIState } from "ui/state";
import clamp from "lodash/clamp";
import CodeMirror from "./CodeMirror";

enum Keys {
  ENTER = "Enter",
  ESCAPE = "Escape",
  TAB = "Tab",
  ARROW_DOWN = "ArrowDown",
  ARROW_UP = "ArrowUp",
  ARROW_RIGHT = "ArrowRight",
  ARROW_LEFT = "ArrowLeft",
}

function useGetMatches(expression: string) {
  const frameScope = useSelector((state: UIState) => getFrameScope(state, "0:0"));

  if (!expression || !frameScope?.scope) {
    return [];
  }

  return getAutocompleteMatches(expression, frameScope.scope);
}
function useShowAutocomplete(expression: string, hideAutocomplete: boolean) {
  const matches = useGetMatches(expression);
  const matchCount = matches.length;

  // Bail if the only suggested autocomplete option has already been applied to the input.
  if (matchCount === 1 && insertAutocompleteMatch(expression, matches[0]) === expression) {
    return false;
  }

  return !hideAutocomplete && matchCount;
}

function useHistory(setValue: Dispatch<SetStateAction<string>>) {
  const commandHistory = useSelector(getCommandHistory);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const moveHistoryCursor = (difference: -1 | 1) => {
    if (commandHistory.length > 0) {
      const newIndex = clamp(historyIndex + difference, 0, commandHistory.length);

      setValue(["", ...commandHistory][newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  return { moveHistoryCursor, setHistoryIndex };
}

function useAutocomplete(expression: string) {
  const [hideAutocomplete, setHideAutocomplete] = useState(true);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const showAutocomplete = useShowAutocomplete(expression, hideAutocomplete);
  const matches = useGetMatches(expression);

  const moveAutocompleteCursor = (difference: number) => {
    const matchesCount = matches.length;

    const newIndex = (matchesCount + autocompleteIndex - difference) % matchesCount;
    setAutocompleteIndex(newIndex);
  };
  const applySelectedMatch = () => {
    const match = matches[autocompleteIndex];
    return insertAutocompleteMatch(expression, match);
  };

  return {
    applySelectedMatch,
    autocompleteIndex,
    matches,
    moveAutocompleteCursor,
    setAutocompleteIndex,
    setHideAutocomplete,
    showAutocomplete,
  };
}

export default function JSTerm() {
  const dispatch = useDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const [value, setValue] = useState("");
  const inputNode = useRef<HTMLDivElement | null>(null);

  const { moveHistoryCursor, setHistoryIndex } = useHistory(setValue);
  const {
    applySelectedMatch,
    autocompleteIndex,
    matches,
    moveAutocompleteCursor,
    setAutocompleteIndex,
    setHideAutocomplete,
    showAutocomplete,
  } = useAutocomplete(value);

  const onRegularKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      execute();
    } else if (e.key === "ArrowUp") {
      moveHistoryCursor(1);
    } else if (e.key === "ArrowDown") {
      moveHistoryCursor(-1);
    }
  };

  const onAutocompleteKeyPress = (e: KeyboardEvent) => {
    if (e.key === Keys.ENTER || e.key === Keys.TAB) {
      e.preventDefault();
      autocomplete();
    } else if (e.key === Keys.ARROW_DOWN) {
      e.preventDefault();
      moveAutocompleteCursor(-1);
    } else if (e.key === Keys.ARROW_UP) {
      e.preventDefault();
      moveAutocompleteCursor(1);
    }

    if (
      [Keys.ENTER, Keys.TAB, Keys.ESCAPE, Keys.ARROW_RIGHT, Keys.ARROW_LEFT].includes(e.key as Keys)
    ) {
      setHideAutocomplete(true);
    }
  };
  const onKeyPress = (e: KeyboardEvent) => {
    if (showAutocomplete) {
      onAutocompleteKeyPress(e);
    } else {
      onRegularKeyPress(e);
    }

    if (![Keys.ARROW_DOWN, Keys.ARROW_UP, Keys.ESCAPE].includes(e.key as Keys)) {
      setHideAutocomplete(false);
      setAutocompleteIndex(0);
    }
  };
  const onSelection = (obj?: any) => {
    const cursorMoved = obj?.origin && ["*mouse", "+move"].includes(obj.origin);

    if (cursorMoved) {
      setHideAutocomplete(true);
    }
  };
  const autocomplete = () => setValue(applySelectedMatch());
  const execute = () => {
    if (!value) {
      return;
    }

    const canEval = recording!.userRole !== "team-user";
    if (canEval) {
      dispatch(actions.evaluateExpression(value));
    } else {
      dispatch(actions.paywallExpression(value));
    }

    setValue("");
    setHistoryIndex(0);
  };

  return (
    <div className="relative">
      <div
        className="jsterm-input-container devtools-input"
        key="jsterm-container"
        aria-live="off"
        tabIndex={-1}
        ref={inputNode}
      >
        <CodeMirror
          onKeyPress={onKeyPress}
          value={value}
          onSelection={onSelection}
          setValue={setValue}
          execute={execute}
        />
      </div>
      {showAutocomplete ? (
        <Autocomplete
          leftOffset={getCursorIndex(value)}
          matches={matches}
          selectedIndex={autocompleteIndex}
          onMatchClick={autocomplete}
        />
      ) : null}
    </div>
  );
}
