import React, { useRef, useEffect } from "react";
import ReactDOM from "react-dom";
// import { createEditor } from "devtools/client/debugger/src/utils/editor"
import CodeMirror from "codemirror";

export function BreakpointEditor({
  defaultValue,
  autofocus,
  onBlur,
  onChange,
  onKeyDown,
  onClick,
  onMouseOver,
  onScroll,
  onGutterClick,
}) {
  const editorNode = useRef(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      const codeMirror = CodeMirror.fromTextArea(editorNode.current, {
        mode: "javascript",
        theme: "mozilla",
        lineNumbers: false,
        autofocus,
      });

      codeMirror.setValue(defaultValue || "");
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
        codeMirrorWrapper.addEventListener("blur", e => onBlur(e));
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

      setTimeout(() => codeMirror.focus(), 0);
      codeMirror.setCursor(0, 0);
      window.foo = codeMirror;
      return codeMirror;
    });
  }, []);

  return <textarea ref={editorNode} className="editor-mount" />;
}
