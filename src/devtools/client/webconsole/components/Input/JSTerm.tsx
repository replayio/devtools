import React, { useRef, useState } from "react";
import { Editor } from "codemirror";
import { useDispatch, useSelector } from "react-redux";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getCursorIndex, getRemainingCompletedTextAfterCursor } from "../../utils/autocomplete";
import AutocompleteMatches from "./AutocompleteMatches";
import CodeMirror from "./CodeMirror";
import { evaluateExpression, paywallExpression } from "../../actions/input";
import EagerEvalFooter from "./EagerEvalFooter";
import useAutocomplete from "./useAutocomplete";
import useEvaluationHistory from "./useEvaluationHistory";
import { getIsInLoadedRegion } from "ui/reducers/timeline";
import { isTest } from "ui/utils/environment";

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

const getJsTermApi = (
  editor: Editor,
  execute: () => void,
  showAutocomplete?: (show: boolean) => void
) => {
  return {
    editor,
    setValue: (newValue = "") => {
      // In order to get the autocomplete popup to work properly, we need to set the
      // editor text and the cursor in the same operation. If we don't, the text change
      // is done before the cursor is moved, and the autocompletion call to the server
      // sends an erroneous query.
      editor.operation(() => {
        editor.setValue(newValue);

        // Set the cursor at the end of the input.
        const lines = newValue.split("\n");
        editor.setCursor({
          line: lines.length - 1,
          ch: lines[lines.length - 1].length,
        });
      });
    },
    execute,
    showAutocomplete,
  };
};

export default function JSTerm() {
  const dispatch = useDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const isInLoadedRegion = useSelector(getIsInLoadedRegion);

  const [value, setValue] = useState("");
  const [autocompletePreview, setAutocompletePreview] = useState<string | null>(null);
  const executeRef = useRef(() => {});
  const _execute = () => executeRef.current();

  const { moveHistoryCursor, setHistoryIndex } = useEvaluationHistory(setValue);

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === Keys.ENTER) {
      e.preventDefault();
      _execute();
    } else if (e.key === Keys.ARROW_UP) {
      moveHistoryCursor(1);
    } else if (e.key === Keys.ARROW_DOWN) {
      moveHistoryCursor(-1);
    }
  };
  const onPreviewAvailable = (previewValue: string | null) => setAutocompletePreview(previewValue);
  executeRef.current = () => {
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
          className="jsterm-input-container"
          key="jsterm-container"
          aria-live="off"
          tabIndex={-1}
        >
          {isInLoadedRegion ? (
            <EditorWithAutocomplete
              onEditorMount={(editor: Editor, showAutocomplete?: (show: boolean) => void) =>
                (window.jsterm = getJsTermApi(editor, _execute, showAutocomplete))
              }
              onPreviewAvailable={onPreviewAvailable}
              value={value}
              setValue={setValue}
              onRegularKeyPress={onKeyPress}
            />
          ) : (
            <div className="flex items-center h-full italic text-gray-400">Loading…</div>
          )}
        </div>
      </div>
      <EagerEvalFooter expression={value} completedExpression={autocompletePreview} />
    </div>
  );
}

export function EditorWithAutocomplete({
  onEditorMount,
  onRegularKeyPress,
  onPreviewAvailable,
  setValue,
  value,
}: {
  onEditorMount: (editor: Editor, showAutocomplete?: (show: boolean) => void) => void;
  onRegularKeyPress: (e: KeyboardEvent) => void;
  onPreviewAvailable: (value: string | null) => void;
  setValue: (newValue: string) => void;
  value: string;
}) {
  const {
    autocompleteIndex,
    matches,
    shouldShowAutocomplete,
    applySelectedMatch,
    moveAutocompleteCursor,
    resetAutocompleteIndex,
    setHideAutocomplete,
  } = useAutocomplete(value, onPreviewAvailable);

  const autocomplete = () => setValue(applySelectedMatch());
  const onSelection = (obj?: any) => {
    const cursorMoved = obj?.origin && ["*mouse", "+move"].includes(obj.origin);

    if (cursorMoved) {
      setHideAutocomplete(true);
    }
  };
  // for use in e2e tests
  const showAutocomplete = isTest()
    ? (show: boolean) => {
        setHideAutocomplete(!show);
        if (show) {
          resetAutocompleteIndex();
        }
      }
    : undefined;
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

  return (
    <div className="pl-7">
      <CodeMirror
        onKeyPress={onKeyPress}
        value={value}
        onSelection={onSelection}
        setValue={setValue}
        onEditorMount={(editor: Editor) => onEditorMount(editor, showAutocomplete)}
      />
      {shouldShowAutocomplete ? (
        <div className="absolute ml-8 opacity-50" style={{ left: `${value.length}ch`, top: `5px` }}>
          {getRemainingCompletedTextAfterCursor(value, matches[autocompleteIndex])}
        </div>
      ) : null}
      {shouldShowAutocomplete && (
        <AutocompleteMatches
          leftOffset={getCursorIndex(value)}
          matches={matches}
          selectedIndex={autocompleteIndex}
          onMatchClick={autocomplete}
        />
      )}
    </div>
  );
}
