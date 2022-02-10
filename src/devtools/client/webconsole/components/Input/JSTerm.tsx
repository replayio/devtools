import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getCursorIndex, getRemainingCompletedTextAfterCursor } from "../../utils/autocomplete";
import AutocompleteMatches from "./AutocompleteMatches";
import CodeMirror from "./CodeMirror";
import { evaluateExpression, paywallExpression } from "../../actions/input";
import EagerEvalFooter from "./EagerEvalFooter";
import useAutocomplete from "./useAutocomplete";
import useEvaluationHistory from "./useEvaluationHistory";

enum Keys {
  BACKSPACE = "Backspace",
  ENTER = "Enter",
  ESCAPE = "Escape",
  TAB = "Tab",
  ARROW_DOWN = "ArrowDown",
  ARROW_UP = "ArrowUp",
  ARROW_RIGHT = "ArrowRight",
  ARROW_LEFT = "ArrowLeft",
}

const DISMISS_KEYS = [
  Keys.BACKSPACE,
  Keys.ENTER,
  Keys.TAB,
  Keys.ESCAPE,
  Keys.ARROW_RIGHT,
  Keys.ARROW_LEFT,
];

export default function JSTerm() {
  const dispatch = useDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const [value, setValue] = useState("");
  const inputNode = useRef<HTMLDivElement | null>(null);

  const { moveHistoryCursor, setHistoryIndex } = useEvaluationHistory(setValue);
  const {
    autocompleteIndex,
    matches,
    shouldShowAutocomplete,
    applySelectedMatch,
    moveAutocompleteCursor,
    resetAutocompleteIndex,
    setHideAutocomplete,
  } = useAutocomplete(value);

  const onRegularKeyPress = (e: KeyboardEvent) => {
    if (e.key === Keys.ENTER) {
      e.preventDefault();
      execute();
    } else if (e.key === Keys.ARROW_UP) {
      moveHistoryCursor(1);
    } else if (e.key === Keys.ARROW_DOWN) {
      moveHistoryCursor(-1);
    }
  };
  const onAutocompleteKeyPress = (e: KeyboardEvent) => {
    if (e.key === Keys.ENTER || e.key === Keys.TAB || e.key === Keys.ARROW_RIGHT) {
      e.preventDefault();
      autocomplete();
    } else if (e.key === Keys.ARROW_DOWN) {
      e.preventDefault();
      moveAutocompleteCursor(-1);
    } else if (e.key === Keys.ARROW_UP) {
      e.preventDefault();
      moveAutocompleteCursor(1);
    }

    if ((DISMISS_KEYS as string[]).includes(e.key)) {
      setHideAutocomplete(true);
    }
  };
  const onKeyPress = (e: KeyboardEvent) => {
    if (shouldShowAutocomplete) {
      onAutocompleteKeyPress(e);
    } else {
      onRegularKeyPress(e);
    }

    if (
      ![
        Keys.ARROW_DOWN,
        Keys.ARROW_UP,
        Keys.ESCAPE,
        Keys.ENTER,
        Keys.TAB,
        Keys.ARROW_RIGHT,
      ].includes(e.key as Keys)
    ) {
      setHideAutocomplete(false);
      resetAutocompleteIndex();
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
      dispatch(evaluateExpression(value));
    } else {
      dispatch(paywallExpression(value));
    }

    setValue("");
    setHistoryIndex(0);
  };

  return (
    <div>
      <div className="relative">
        <div
          className="jsterm-input-container devtools-input relative"
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
          {shouldShowAutocomplete ? (
            <div
              className="absolute ml-8 opacity-50"
              style={{ left: `${value.length}ch`, top: `5px` }}
            >
              {getRemainingCompletedTextAfterCursor(value, matches[autocompleteIndex])}
            </div>
          ) : null}
        </div>
        {shouldShowAutocomplete ? (
          <AutocompleteMatches
            leftOffset={getCursorIndex(value)}
            matches={matches}
            selectedIndex={autocompleteIndex}
            onMatchClick={autocomplete}
          />
        ) : null}
      </div>
      <EagerEvalFooter
        expression={value}
        completedExpression={shouldShowAutocomplete ? applySelectedMatch() : null}
      />
    </div>
  );
}
