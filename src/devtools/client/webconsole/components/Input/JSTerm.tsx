import { Editor } from "codemirror";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useAppSelector } from "ui/setup/hooks";
import {
  EditorWithAutocomplete,
  Keys,
} from "ui/components/shared/CodeEditor/EditorWithAutocomplete";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getIsInLoadedRegion } from "ui/reducers/app";
import { getPlayback } from "ui/reducers/timeline";

import EagerEvalFooter from "./EagerEvalFooter";

const getJsTermApi = (
  editor: Editor,
  execute: () => void,
  setValueCallback: (value: string) => void,
  showAutocomplete?: (show: boolean) => void
) => {
  return {
    editor,
    execute,
    setValue: (value = "") => {
      // In order to get the autocomplete popup to work properly, we need to set the
      // editor text and the cursor in the same operation. If we don't, the text change
      // is done before the cursor is moved, and the autocompletion call to the server
      // sends an erroneous query.
      editor.operation(() => {
        editor.setValue(value);

        // Set the cursor at the end of the input.
        const lines = value.split("\n");
        editor.setCursor({
          line: lines.length - 1,
          ch: lines[lines.length - 1].length,
        });
      });

      setValueCallback(value);
    },
    showAutocomplete,
  };
};

export default function JSTerm({
  addTerminalExpression,
  terminalExpressionHistory,
}: {
  addTerminalExpression: (expression: string) => void;
  terminalExpressionHistory: string[];
}) {
  const isInLoadedRegion = useAppSelector(getIsInLoadedRegion);
  const playback = useAppSelector(getPlayback);

  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const [autocompletePreview, setAutocompletePreview] = useState<string | null>(null);

  const execute = () => {
    const trimmedValue = value.trim();
    if (trimmedValue !== "") {
      setValue("");
      setHistoryIndex(null);
      addTerminalExpression(trimmedValue);
    }
  };

  useEffect(() => {
    // HACK
    // Update this after each render to avoid a stale closure.
    if (window.jsterm != null) {
      window.jsterm.execute = execute;
    }
  });

  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const canEval = recording && recording.userRole !== "team-user";

  const onKeyPress = (e: KeyboardEvent, editor: Editor) => {
    if (e.key === Keys.ENTER && !e.shiftKey) {
      e.preventDefault();

      execute();
    } else if (e.key === Keys.ARROW_UP && editor.getCursor().line === 0) {
      e.preventDefault();

      if (historyIndex !== null && historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const newValue = terminalExpressionHistory[newIndex];

        setHistoryIndex(newIndex);
        setValue(newValue);
      }
    } else if (e.key === Keys.ARROW_DOWN && editor.getCursor().line === editor.lineCount() - 1) {
      e.preventDefault();

      if (historyIndex !== null) {
        if (historyIndex + 1 < terminalExpressionHistory.length) {
          const newIndex = historyIndex + 1;
          const newValue = terminalExpressionHistory[newIndex];

          setHistoryIndex(newIndex);
          setValue(newValue);
        } else {
          setHistoryIndex(null);
          setValue("");
        }
      }
    }
  };

  const onPreviewAvailable = (previewValue: string | null) => setAutocompletePreview(previewValue);

  // HACK
  // Forcefully remount EditorWithAutocomplete between Offscreen show/hide events.
  // This avoids bugs where the component doesn't properly reset its state.
  const [key, setKey] = useState(0);
  useLayoutEffect(() => () => setKey(prevKey => prevKey + 1), []);

  let inaccessibleReason: InaccessibleReason | undefined = undefined;

  if (canEval) {
    if (!isInLoadedRegion) {
      inaccessibleReason = playback ? "disabledPlayback" : "other";
    }
  } else {
    inaccessibleReason = "userRole";
  }

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
          {inaccessibleReason ? (
            <InaccessibleEditor reason={inaccessibleReason} />
          ) : (
            <EditorWithAutocomplete
              key={key}
              onEditorMount={(editor: Editor, showAutocomplete?: (show: boolean) => void) =>
                (window.jsterm = getJsTermApi(editor, execute, setValue, showAutocomplete))
              }
              onPreviewAvailable={onPreviewAvailable}
              onRegularKeyPress={onKeyPress}
              setValue={setValue}
              value={value}
            />
          )}
        </div>
      </div>
      <EagerEvalFooter expression={value} completedExpression={autocompletePreview} />
    </div>
  );
}

type InaccessibleReason = "disabledPlayback" | "userRole" | "other";

interface InaccessibleEditorProps {
  reason: InaccessibleReason;
}

const reasonStrings: Record<InaccessibleReason, string> = {
  disabledPlayback: "Console evaluations are disabled during playback",
  userRole: "Only 'Developer'-role users can evaluate expressions",
  other: "Unavailable...",
};

function InaccessibleEditor({ reason }: InaccessibleEditorProps) {
  const msg = reasonStrings[reason];

  return <div className="flex h-full items-center italic text-gray-400">{msg}</div>;
}
