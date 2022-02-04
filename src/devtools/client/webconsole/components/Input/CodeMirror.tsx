import { Editor, EditorChange } from "codemirror";
import React, { useRef } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";

require("codemirror/mode/javascript/javascript");
require("codemirror/mode/htmlmixed/htmlmixed");
require("codemirror/mode/coffeescript/coffeescript");
require("codemirror/mode/jsx/jsx");
require("codemirror/mode/elm/elm");
require("codemirror/mode/clojure/clojure");
require("codemirror/mode/haxe/haxe");
require("codemirror/addon/search/searchcursor");
require("codemirror/addon/runmode/runmode");
require("codemirror/addon/selection/active-line");
require("codemirror/addon/edit/matchbrackets");

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
};

// CodeMirror does not refresh its event handlers once it's initialized,
// making it difficult to work with using React functional components
// whose function references change on each render cycle.

// This wrapper works around that by passing in callbacks that reference
// refs, so that CodeMirror always ends up using the latest callback.

export function WrappedCodeMirror({
  value,
  onKeyPress,
  setValue,
  onSelection,
}: {
  value: string;
  onKeyPress: (e: KeyboardEvent) => void;
  setValue: (value: string) => void;
  onSelection: (obj: any) => void;
}) {
  const onKeyPressRef = useRef(onKeyPress);
  onKeyPressRef.current = onKeyPress;
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;
  const onSelectionRef = useRef(onSelection);
  onSelectionRef.current = onSelection;

  const _onKeyPress = (_: Editor, event: any) => {
    onKeyPressRef.current(event);
  };
  const _onBeforeChange = (_: Editor, __: EditorChange, value: string) => {
    setValueRef.current(value);
  };
  const _onSelection = (_: Editor, obj: any) => {
    onSelectionRef.current(obj);
  };

  return (
    <CodeMirror
      options={CODEMIRROR_OPTIONS}
      value={value}
      editorDidMount={editor => {
        window.jsterm = { editor };
      }}
      onBeforeChange={_onBeforeChange}
      onKeyDown={_onKeyPress}
      onSelection={_onSelection}
    />
  );
}
