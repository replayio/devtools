import React, { Dispatch, SetStateAction, useRef, useState, useEffect } from "react";
import actions from "devtools/client/webconsole/actions/index";
import { useDispatch, useSelector } from "react-redux";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getFrameScope } from "devtools/client/debugger/src/reducers/pause";
import { getCommandHistory } from "../../selectors/messages";
import {
  fuzzyFilter,
  getAutocompleteMatches,
  getCursorIndex,
  getPropertyExpression,
  insertAutocompleteMatch,
  normalizeString,
} from "../../utils/autocomplete";
import Autocomplete from "./Autocomplete";
import { UIState } from "ui/state";
import clamp from "lodash/clamp";
import CodeMirror from "./CodeMirror";
import uniq from "lodash/uniq";
import { eagerEvaluateExpression, getEvaluatedProperties } from "../../utils/autocomplete-eager";

import { evaluateExpression, paywallExpression } from "../../actions/input";
import { ValueFront } from "protocol/thread";
import EagerEvalFooter from "./EagerEvalFooter";

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

function useGetScopeMatches(expression: string) {
  const frameScope = useSelector((state: UIState) => getFrameScope(state, "0:0"));

  if (!expression || !frameScope?.scope) {
    return [];
  }

  return getAutocompleteMatches(expression, frameScope.scope);
}
function useGetEvalMatches(value: string) {
  const [matches, setMatches] = useState<string[]>([]);
  const evalIdRef = useRef(0);

  useEffect(() => {
    async function updateMatches() {
      setMatches([]);
      const propertyExpression = getPropertyExpression(value);

      if (!propertyExpression) {
        return;
      }

      evalIdRef.current++;
      const evalId = evalIdRef.current;
      const evaluatedProperties = await getEvaluatedProperties(propertyExpression.left);

      if (evalIdRef.current === evalId) {
        setMatches(fuzzyFilter(evaluatedProperties, normalizeString(propertyExpression.right)));
      }
    }

    updateMatches();
  }, [value]);

  return matches;
}
function useGetMatches(expression: string) {
  const scopeMatches = useGetScopeMatches(expression);
  const evalMatches = useGetEvalMatches(expression);

  return uniq([...scopeMatches, ...evalMatches]);
}
function useShowAutocomplete(expression: string, hideAutocomplete: boolean) {
  const matches = useGetMatches(expression);
  const matchCount = matches.length;

  // Bail if the only suggested autocomplete option has already been applied to the input.
  if (matchCount === 1 && insertAutocompleteMatch(expression, matches[0]) === expression) {
    return false;
  }

  return !hideAutocomplete && !!matchCount;
}

function useHistory(setValue: (newValue: string) => void) {
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

function useEagerEvalPreview() {
  const [grip, setGrip] = useState<ValueFront | null>(null);
  const evalIdRef = useRef(0);

  const refreshEagerEval = async (expression: string) => {
    setGrip(null);
    evalIdRef.current++;
    const evalId = evalIdRef.current;
    const rv = await eagerEvaluateExpression(expression);
    const isUndefined = rv?.isPrimitive && !rv.primitive;

    if (evalIdRef.current === evalId && !isUndefined) {
      setGrip(rv);
    }
  };

  return { refreshEagerEval, grip };
}
export default function JSTerm() {
  const dispatch = useDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const [value, _setValue] = useState("");
  const inputNode = useRef<HTMLDivElement | null>(null);

  const setValue = (newValue: string) => {
    _setValue(newValue);
    refreshEagerEval(newValue);
  };

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
  const { refreshEagerEval, grip } = useEagerEvalPreview();

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

    if (
      (
        [
          Keys.BACKSPACE,
          Keys.ENTER,
          Keys.TAB,
          Keys.ESCAPE,
          Keys.ARROW_RIGHT,
          Keys.ARROW_LEFT,
        ] as string[]
      ).includes(e.key)
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
      dispatch(evaluateExpression(value));
    } else {
      dispatch(paywallExpression(value));
    }

    setValue("");
    setHistoryIndex(0);
  };

  return (
    <div className="relative">
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
      <EagerEvalFooter value={value} grip={grip} />
    </div>
  );
}
