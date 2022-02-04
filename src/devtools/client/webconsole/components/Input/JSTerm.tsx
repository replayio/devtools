import React, { useEffect, useRef, useState } from "react";
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

async function createEditor({
  onArrowPress,
  onEnter,
  onTab,
}: {
  onArrowPress: (arrow: "up" | "down") => void;
  onEnter: () => void;
  onTab: () => void;
}) {
  await gToolbox.startPanel("debugger");
  const Editor = (await import("devtools/client/debugger/src/utils/editor/source-editor")).default;

  const editor = new Editor({
    autofocus: true,
    enableCodeFolding: false,
    lineNumbers: false,
    lineWrapping: true,
    mode: {
      name: "javascript",
      globalVars: true,
    },
    theme: "mozilla",
    styleActiveLine: false,
    tabIndex: "0",
    readOnly: false,
    viewportMargin: Infinity,
    disableSearchAddon: true,
    extraKeys: {
      Tab: onTab,
      Enter: onEnter,
      "Cmd-Enter": onEnter,
      "Ctrl-Enter": onEnter,
      Esc: false,
      "Cmd-F": false,
      "Ctrl-F": false,
      Up: () => onArrowPress("up"),
      Down: () => onArrowPress("down"),
    },
  });
  return editor;
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

export default function JSTerm() {
  const dispatch = useDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const commandHistory = useSelector(getCommandHistory);

  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [hideAutocomplete, setHideAutocomplete] = useState(true);
  const [autocompleteIndex, setAutocompleteIndex] = useState<number>(0);
  const [value, setValue] = useState<string>("");
  const [charWidth, setCharWidth] = useState<number>(0);
  const inputNode = useRef<HTMLDivElement | null>(null);

  const matches = useGetMatches(value);
  const showAutocomplete = useShowAutocomplete(value, hideAutocomplete);

  const moveAutocompleteCursor = (difference: number) => {
    const matchesCount = matches.length;

    const newIndex = (matchesCount + autocompleteIndex - difference) % matchesCount;
    setAutocompleteIndex(newIndex);
  };
  const moveHistoryCursor = (difference: number) => {
    if (commandHistory.length > 0) {
      const newIndex = clamp(historyIndex + difference, 0, commandHistory.length);

      setValue(["", ...commandHistory][newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const onArrowPress = (arrow: "up" | "down") => {
    if (arrow === "up") {
      if (showAutocomplete) {
        moveAutocompleteCursor(1);
      } else {
        moveHistoryCursor(1);
      }
    } else if (arrow === "down") {
      if (showAutocomplete) {
        moveAutocompleteCursor(-1);
      } else {
        moveHistoryCursor(-1);
      }
    }
  };
  const onEnter = () => {
    if (!showAutocomplete) {
      execute();
    } else {
      const match = matches[autocompleteIndex];

      selectAutocompleteMatch(match);
    }
  };
  const onTab = () => {
    if (showAutocomplete) {
      const match = matches[autocompleteIndex];
      selectAutocompleteMatch(match);
    }
  };
  const onChange = (cm: any) => {
    const value = cm.getValue();
    setValue(value);
  };
  const onKeyDown = (_: any, event: KeyboardEvent) => {
    if (["Enter", "Tab", "Escape", "ArrowRight", "ArrowLeft"].includes(event.key)) {
      setHideAutocomplete(true);
    } else {
      setHideAutocomplete(false);
      setAutocompleteIndex(0);
    }
  };
  const onBeforeSelectionChange = (_: any, obj: { origin: string }) => {
    const cursorMoved = ["*mouse", "+move"].includes(obj.origin);

    if (cursorMoved) {
      setHideAutocomplete(true);
    }
  };

  const selectAutocompleteMatch = (match: string) => {
    const newValue = insertAutocompleteMatch(value, match);
    setValue(newValue);
  };

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

    return null;
  };

  useEffect(function () {
    async function initializeEditor() {
      const editor = await createEditor({
        onArrowPress: onArrowPress,
        onEnter: onEnter,
        onTab: onTab,
      });
      editor.appendToLocalElement(inputNode);
      editor.codeMirror.on("change", onChange);
      editor.codeMirror.on("keydown", onKeyDown);
      editor.codeMirror.on("beforeSelectionChange", onBeforeSelectionChange);
      setCharWidth(editor.editor.display.cachedCharWidth);

      // this might need other things since we use jsterm
      // this will 100% break tests fix it
      window.jsterm = { editor };
    }
    initializeEditor();
  }, []);

  return (
    <div className="relative">
      <div
        className="jsterm-input-container devtools-input"
        key="jsterm-container"
        aria-live="off"
        tabIndex={-1}
        ref={inputNode}
      />
      {showAutocomplete ? (
        <Autocomplete
          leftOffset={charWidth * getCursorIndex(value)}
          matches={matches}
          selectedIndex={autocompleteIndex}
          onMatchClick={selectAutocompleteMatch}
        />
      ) : null}
    </div>
  );
}
