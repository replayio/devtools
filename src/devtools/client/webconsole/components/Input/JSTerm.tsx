import React, { useRef, useState } from "react";
import { Editor } from "codemirror";
import { useDispatch, useSelector } from "react-redux";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { evaluateExpression, paywallExpression } from "../../actions/input";
import EagerEvalFooter from "./EagerEvalFooter";
import useEvaluationHistory from "./useEvaluationHistory";
import { getIsInLoadedRegion } from "ui/reducers/timeline";
import {
  EditorWithAutocomplete,
  Keys,
} from "ui/components/shared/CodeEditor/EditorWithAutocomplete";

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
