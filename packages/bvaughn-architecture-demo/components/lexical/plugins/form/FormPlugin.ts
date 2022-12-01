import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useEffect, useRef } from "react";

export default function FormPlugin({
  onCancel,
  onChange,
  onSubmit,
}: {
  onCancel?: (editorState: EditorState) => void;
  onChange?: (editorState: EditorState) => void;
  onSubmit: (editorState: EditorState) => void;
}) {
  const [editor] = useLexicalComposerContext();

  // Shares most recently committed component state with imperative Lexical API (which only runs on mount)
  const committedStateRef = useRef({
    onCancel,
    onChange,
    onSubmit,
  });
  useEffect(() => {
    committedStateRef.current.onCancel = onCancel;
    committedStateRef.current.onChange = onChange;
    committedStateRef.current.onSubmit = onSubmit;
  });

  useEffect(() => {
    function onEnterCommand(event: KeyboardEvent) {
      const { onSubmit } = committedStateRef.current;

      if (!editor.isEditable()) {
        return false;
      } else if (event.defaultPrevented) {
        return false;
      }

      if (event.shiftKey) {
        return false;
      } else {
        event.preventDefault();
        onSubmit(editor.getEditorState());
        return true;
      }
    }

    function onEscapeCommand(event: KeyboardEvent) {
      const { onCancel } = committedStateRef.current;

      if (!editor.isEditable()) {
        return false;
      } else if (event.defaultPrevented) {
        return false;
      }

      if (typeof onCancel === "function") {
        event.preventDefault();
        onCancel(editor.getEditorState());
        return true;
      }

      return false;
    }

    function onUpdate() {
      const { onChange } = committedStateRef.current;

      if (!editor.isEditable()) {
        return false;
      }

      if (typeof onChange === "function") {
        onChange(editor.getEditorState());
      }
    }

    return mergeRegister(
      editor.registerUpdateListener(onUpdate),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnterCommand, COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscapeCommand, COMMAND_PRIORITY_NORMAL)
    );
  }, [editor]);

  return null;
}
