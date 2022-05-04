import { Editor } from "codemirror";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  EditorWithAutocomplete,
  Keys,
} from "ui/components/shared/CodeEditor/EditorWithAutocomplete";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getIsInLoadedRegion } from "ui/reducers/app";
import { getPlayback } from "ui/reducers/timeline";

import { evaluateExpression, paywallExpression } from "../../actions/input";

import EagerEvalFooter from "./EagerEvalFooter";
import useEvaluationHistory from "./useEvaluationHistory";

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

  const onKeyPress = (e: KeyboardEvent, editor: Editor) => {
    if (e.key === Keys.ENTER && !e.shiftKey) {
      e.preventDefault();
      _execute();
    } else if (e.key === Keys.ARROW_UP && editor.getCursor().line === 0) {
      moveHistoryCursor(1);
    } else if (e.key === Keys.ARROW_DOWN && editor.getCursor().line === editor.lineCount() - 1) {
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

  // TODO [bvaughn] Refocus JSTerm <input> when SearchInput is hidden
  return (
    <div>
      <div className="relative">
        <div
          className="jsterm-input-container flex items-center"
          key="jsterm-container"
          aria-live="off"
          tabIndex={-1}
        >
          <div className="console-chevron ml-3 mr-1 h-3 w-3" />
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
            <InaccessibleEditor />
          )}
        </div>
      </div>
      <EagerEvalFooter expression={value} completedExpression={autocompletePreview} />
    </div>
  );
}

function InaccessibleEditor() {
  const playback = useSelector(getPlayback);
  const msg = playback ? "Console evaluations are disabled during playback" : "Loading…";

  return <div className="flex h-full items-center italic text-gray-400">{msg}</div>;
}
