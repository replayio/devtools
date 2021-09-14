import React, { useRef, useEffect } from "react";
import { getCodeMirror } from "devtools/client/debugger/src/utils/editor/create-editor";

export function PanelInput({
  defaultValue,
  autofocus,
  onBlur,
  onChange,
  onKeyDown,
  onEnter,
  onEscape,
  onClick,
  onMouseOver,
  onScroll,
  onGutterClick,
}) {
  const textAreaNode = useRef(null);
  const codeMirrorNode = useRef(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      let extraKeys = {
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
        mode: "javascript",
        theme: "mozilla",
        lineNumbers: false,
        autofocus,
        extraKeys,
      });

      const inputValue = defaultValue || "";
      codeMirror.setValue(inputValue);
      const codeMirrorWrapper = codeMirror.getWrapperElement();

      // Set code editor wrapper to be focusable
      codeMirrorWrapper.tabIndex = 0;
      if (onKeyDown) {
        codeMirrorWrapper.addEventListener("keydown", e => onKeyDown(e, codeMirror));
      }

      if (onClick) {
        codeMirrorWrapper.addEventListener("keydown", e => onClick(e));
      }

      if (onBlur) {
        codeMirror.on("blur", e => onBlur(e));
      }

      if (onChange) {
        codeMirror.on("change", (cm, e) => onChange(cm, e));
      }

      if (onMouseOver) {
        codeMirrorWrapper.addEventListener("mouseover", e => onMouseOver(e));
      }

      if (onScroll) {
        codeMirror.on("scroll", e => onScroll(e));
      }

      if (onGutterClick) {
        codeMirror.on("gutterClick", onGutterClick);
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
