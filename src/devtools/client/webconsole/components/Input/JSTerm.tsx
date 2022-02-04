import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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
import { Controlled as CodeMirror } from "react-codemirror2";

const CODEMIRROR_OPTIONS = {
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
  // extraKeys: {
  //   Tab: onTab,
  //   Enter: onEnter,
  //   "Cmd-Enter": onEnter,
  //   "Ctrl-Enter": onEnter,
  //   Esc: false,
  //   "Cmd-F": false,
  //   "Ctrl-F": false,
  //   Up: () => onArrowPress("up"),
  //   Down: () => onArrowPress("down"),
  // },
};

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

  const editor = new Editor();
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

function useHistory(setValue: Dispatch<SetStateAction<string>>) {
  const commandHistory = useSelector(getCommandHistory);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const moveHistoryCursor = (difference: number) => {
    if (commandHistory.length > 0) {
      const newIndex = clamp(historyIndex + difference, 0, commandHistory.length);

      setValue(["", ...commandHistory][newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  return { moveHistoryCursor, setHistoryIndex };
}

function useAutocomplete(expression: string) {
  const [hideAutocomplete, setHideAutocomplete] = useState<boolean>(true);
  const [autocompleteIndex, setAutocompleteIndex] = useState<number>(0);
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
  // export default function JSTerm() {
  const dispatch = useDispatch();
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const [value, setValue] = useState<string>("");
  const [charWidth, setCharWidth] = useState<number>(0);
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

  // useEffect(function () {
  //   async function initializeEditor() {
  //     const editor = await createEditor({
  //       onArrowPress: onArrowPress,
  //       onEnter: onEnter,
  //       onTab: onTab,
  //     });
  //     editor.appendToLocalElement(inputNode);
  //     editor.codeMirror.on("change", onChange);
  //     editor.codeMirror.on("keydown", onKeyDown);
  //     editor.codeMirror.on("beforeSelectionChange", onBeforeSelectionChange);
  //     setCharWidth(editor.editor.display.cachedCharWidth);

  //     // this might need other things since we use jsterm
  //     // this will 100% break tests fix it
  //     window.jsterm = { editor };
  //   }
  //   initializeEditor();
  // }, []);

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
    console.log("stuff");
    if (!showAutocomplete) {
      execute();
    } else {
      autocomplete();
    }
  };
  const onTab = () => {
    if (showAutocomplete) {
      autocomplete();
    }
  };
  const onKeyDown = (_: any, event: KeyboardEvent) => {
    if (event.key === "Enter") {
      debugger;
      onEnter();
    } else if (event.key === "Tab") {
      onTab();
    }

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

    return null;
  };

  console.log({ value });

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
          options={CODEMIRROR_OPTIONS}
          value={value}
          onBeforeChange={(_, __, value) => {
            setValue(value);
          }}
          onKeyDown={onKeyDown}
          onSelection={onBeforeSelectionChange}
        />
      </div>
      {showAutocomplete ? (
        <Autocomplete
          leftOffset={charWidth * getCursorIndex(value)}
          matches={matches}
          selectedIndex={autocompleteIndex}
          onMatchClick={autocomplete}
        />
      ) : null}
    </div>
  );
}

function _JSTerm({ options }: any) {
  const [value, setValue] = useState("test");
  const inputElement = useRef<HTMLTextAreaElement | null>(null);

  const onChange = () => console.log("change", new Date());
  useEffect(() => console.log({ options }), []);

  return (
    <div className="jsterm-input-container devtools-input">
      <CodeMirror
        options={options}
        value={value}
        onBeforeChange={(_, __, value) => {
          setValue(value);
        }}
        onChange={onChange}
      />
    </div>
  );
}
