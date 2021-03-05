import React, { useEffect } from "react";
import DraftJSEditor from "./DraftJSEditor";
import "draft-js/dist/Draft.css";

interface DraftJSEditorLoaderProps {
  DraftJS: any;
  editorState: any;
  initialContent: string;
  placeholder: string;
  setEditorState: (state: any) => void;
  setDraftJS: (draftJS: any) => void;
  handleSubmit: (inputValue: string) => void;
  handleCancel: () => void;
}

export default function DraftJSEditorLoader({
  editorState,
  setEditorState,
  DraftJS,
  setDraftJS,
  handleSubmit,
  handleCancel,
  placeholder,
  initialContent,
}: DraftJSEditorLoaderProps) {
  useEffect(function importDraftJS() {
    import("draft-js").then(DraftJS => {
      const { EditorState, ContentState } = DraftJS;
      setEditorState(EditorState.createWithContent(ContentState.createFromText(initialContent)));
      setDraftJS(DraftJS);
    });
  }, []);

  if (!DraftJS) {
    return null;
  }

  return (
    <DraftJSEditor
      {...{ editorState, setEditorState, DraftJS, handleSubmit, handleCancel, placeholder }}
    />
  );
}
