import { Editor, EditorChange } from "codemirror";
import React, { FC, useRef } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";

import "codemirror/mode/javascript/javascript";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/coffeescript/coffeescript";
import "codemirror/mode/jsx/jsx";
import "codemirror/mode/elm/elm";
import "codemirror/mode/clojure/clojure";
import "codemirror/mode/haxe/haxe";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/runmode/runmode";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/edit/matchbrackets";

export type ControlledCodeMirrorOptions = {
  autofocus: boolean;
};
const DEFAULT_OPTIONS = {
  autofocus: false,
};

// CodeMirror does not refresh its event handlers once it's initialized,
// making it difficult to work with using React functional components
// whose function references change on each render cycle.

// This wrapper works around that by passing in callbacks that reference
// refs, so that CodeMirror always ends up using the latest callback.

const ControlledCodeMirror: FC<{
  value: string;
  onKeyPress: (e: KeyboardEvent) => void;
  setValue: (value: string) => void;
  onSelection: (obj: any) => void;
  onEditorMount: (editor: Editor) => void;
  options?: ControlledCodeMirrorOptions;
}> = ({ value, onKeyPress, setValue, onSelection, onEditorMount, options = DEFAULT_OPTIONS }) => {
  const codemirrorOptions = {
    autofocus: options.autofocus,
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
  } as const;

  const onKeyPressRef = useRef(onKeyPress);
  onKeyPressRef.current = onKeyPress;
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;
  const onSelectionRef = useRef(onSelection);
  onSelectionRef.current = onSelection;
  const onEditorMountRef = useRef(onEditorMount);
  onEditorMountRef.current = onEditorMount;

  const _onKeyPress = (_: Editor, event: any) => {
    onKeyPressRef.current(event);
  };
  const _onBeforeChange = (_: Editor, __: EditorChange, value: string) => {
    setValueRef.current(value);
  };
  const _onSelection = (_: Editor, obj: any) => {
    onSelectionRef.current(obj);
  };
  const _onEditorMount = (editor: Editor) => onEditorMountRef.current(editor);

  return (
    <CodeMirror
      className="w-full"
      options={codemirrorOptions}
      value={value}
      editorDidMount={_onEditorMount}
      onBeforeChange={_onBeforeChange}
      onKeyDown={_onKeyPress}
      onSelection={_onSelection}
    />
  );
};

export default ControlledCodeMirror;
