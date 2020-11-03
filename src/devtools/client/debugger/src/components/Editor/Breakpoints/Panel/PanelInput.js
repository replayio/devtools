import React, { useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import CodeMirror from "codemirror";

export function PanelInput({
  defaultValue,
  autofocus,
  onBlur,
  onChange,
  onKeyDown,
  onClick,
  onMouseOver,
  onScroll,
  onGutterClick,
  id,
}) {
  const textAreaNode = useRef(null);
  const codeMirrorNode = useRef(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      const codeMirror = CodeMirror.fromTextArea(textAreaNode.current, {
        mode: "javascript",
        theme: "mozilla",
        lineNumbers: false,
        autofocus,
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
      codeMirrorNode.current.toTextArea();
    };
  }, []);

  useEffect(() => {
    if (autofocus) {
      setTimeout(() => codeMirrorNode.current.focus(), 0);
    }
  }, [autofocus]);

  return <textarea ref={textAreaNode} className={`editor-mount`} />;
}
