import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_CRITICAL,
  EditorState,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useEffect, useRef } from "react";

export default function FormPlugin({
  // FormPlugin listens for the Enter command at CRITICAL priority
  // to prevent Lexical from e.g. inserting line breaks or paragraphs.
  // (Lexical listens at EDITOR priority.)
  // Because of this, FormPlugin may interfere with other plug-ins that listen to Enter.
  // In order to avoid tricky ordering constraints,
  // FormPlugin can be disabled when e.g. the type-ahead plugin is active.
  enableCancel = true,
  enableChange = true,
  enableSubmit = true,

  onCancel,
  onChange,
  onSubmit,
}: {
  enableCancel?: boolean;
  enableChange?: boolean;
  enableSubmit?: boolean;
  onCancel?: (editorState: EditorState) => void;
  onChange?: (editorState: EditorState) => void;
  onSubmit: (editorState: EditorState) => void;
}) {
  const [editor] = useLexicalComposerContext();

  // Shares most recently committed component state with imperative Lexical API (which only runs on mount)
  const committedStateRef = useRef({
    enableCancel,
    enableChange,
    enableSubmit,
    onCancel,
    onChange,
    onSubmit,
  });
  useEffect(() => {
    committedStateRef.current.enableCancel = enableCancel;
    committedStateRef.current.enableChange = enableChange;
    committedStateRef.current.enableSubmit = enableSubmit;
    committedStateRef.current.onCancel = onCancel;
    committedStateRef.current.onChange = onChange;
    committedStateRef.current.onSubmit = onSubmit;
  });

  useEffect(() => {
    function onEnterCommand(event: KeyboardEvent) {
      const { enableSubmit, onSubmit } = committedStateRef.current;

      if (!editor.isEditable()) {
        return false;
      } else if (!enableSubmit) {
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
      const { enableCancel, onCancel } = committedStateRef.current;

      if (!editor.isEditable()) {
        return false;
      } else if (!enableCancel) {
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
      const { enableChange, onChange } = committedStateRef.current;

      if (!editor.isEditable()) {
        return false;
      } else if (!enableChange) {
        return false;
      }

      if (typeof onChange === "function") {
        onChange(editor.getEditorState());
      }
    }

    return mergeRegister(
      editor.registerUpdateListener(onUpdate),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnterCommand, COMMAND_PRIORITY_CRITICAL),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscapeCommand, COMMAND_PRIORITY_CRITICAL)
    );
  }, [editor]);

  return null;
}
