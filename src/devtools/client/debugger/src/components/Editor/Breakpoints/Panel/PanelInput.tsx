import React, { useRef, useEffect, Key } from "react";
import CodeMirror, { Editor, EditorFromTextArea, KeyMap } from "codemirror";
const { getCodeMirror } = require("devtools/client/debugger/src/utils/editor/create-editor");

export function PanelInput({
  autofocus,
  defaultValue,
  onChange,
  onEnter,
  onEscape,
}: {
  autofocus: boolean;
  defaultValue: string;
  onChange: (cm: Editor) => void;
  onEnter: (cm: Editor) => void;
  onEscape: (cm: Editor) => void;
}) {
  const textAreaNode = useRef(null);
  const codeMirrorNode = useRef<EditorFromTextArea | null>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      let extraKeys: KeyMap = {
        Esc: false,
        "Cmd-F": false,
        "Ctrl-F": false,
      };

      if (onEnter) {
        extraKeys = {
          ...extraKeys,
          Enter: onEnter,
          "Cmd-Enter": onEnter,
          "Ctrl-Enter": onEnter,
        };
      }

      if (onEscape) {
        extraKeys.Esc = onEscape;
      }

      const CodeMirror = getCodeMirror();
      const codeMirror = CodeMirror.fromTextArea(textAreaNode.current, {
        autofocus,
        extraKeys,
        lineNumbers: false,
        mode: "javascript",
        scrollbarStyle: null,
        theme: "mozilla",
      });

      const inputValue = defaultValue || "";
      codeMirror.setValue(inputValue);
      const codeMirrorWrapper = codeMirror.getWrapperElement();

      // Set code editor wrapper to be focusable
      codeMirrorWrapper.tabIndex = 0;
      if (onChange) {
        codeMirror.on("change", onChange);
      }

      codeMirror.setCursor(0, inputValue.length);
      codeMirrorNode.current = codeMirror;
      return codeMirror;
    });

    return () => {
      // Convert the editor's codeMirror node to a textarea so that CodeMirror
      // handles its cleanup for us. Without this, the editor sticks around.
      codeMirrorNode.current?.toTextArea();
    };
  }, []);

  useEffect(() => {
    if (autofocus) {
      setTimeout(() => codeMirrorNode.current?.focus(), 0);
    }
  }, [codeMirrorNode, autofocus]);

  return <textarea ref={textAreaNode} className={`editor-mount invisible`} />;
}
