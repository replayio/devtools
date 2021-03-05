import React, { useRef, useEffect } from "react";

const moveSelectionToEnd = (editorState: any, DraftJS: any) => {
  const { EditorState, SelectionState } = DraftJS;
  const content = editorState.getCurrentContent();
  const blockMap = content.getBlockMap();

  const key = blockMap.last().getKey();
  const length = blockMap.last().getLength();

  // On Chrome and Safari, calling focus on contenteditable focuses the
  // cursor at the first character. This is something you don't expect when
  // you're clicking on an input element but not directly on a character.
  // Put the cursor back where it was before the blur.
  const selection = new SelectionState({
    anchorKey: key,
    anchorOffset: length,
    focusKey: key,
    focusOffset: length,
  });
  return EditorState.forceSelection(editorState, selection);
};

interface DraftJSEditorProps {
  DraftJS: any;
  editorState: any;
  placeholder: string;
  setEditorState: (state: any) => void;
  handleSubmit: (inputValue: string) => void;
  handleCancel: () => void;
}

export default function DraftJSEditor({
  DraftJS,
  editorState,
  placeholder,
  setEditorState,
  handleSubmit,
  handleCancel,
}: DraftJSEditorProps) {
  const editorNode = useRef<HTMLDivElement | null>(null);
  const wrapperNode = useRef<HTMLDivElement | null>(null);
  const { Editor, getDefaultKeyBinding, KeyBindingUtil } = DraftJS;

  useEffect(() => {
    // The order is important here — we focus the editor first before scrolling the
    // wrapper into view. Otherwise, the scrolling animation is interrupted by the focus.
    editorNode.current!.focus();
    wrapperNode.current!.scrollIntoView({ block: "center", behavior: "smooth" });
    // Move the cursor so that it's at the end of the selection instead of the beginning.
    // Which DraftJS doesn't make easy: https://github.com/brijeshb42/medium-draft/issues/71
    setEditorState(moveSelectionToEnd(editorState, DraftJS));
  }, []);

  const keyBindingFn = (e: React.KeyboardEvent) => {
    if (e.keyCode == 13 && e.metaKey && KeyBindingUtil.hasCommandModifier(e)) {
      return "save";
    }
    if (e.keyCode == 27) {
      return "cancel";
    }

    return getDefaultKeyBinding(e);
  };
  const handleKeyCommand = (command: "save" | "cancel") => {
    if (command === "save") {
      const inputValue = editorState.getCurrentContent().getPlainText();
      handleSubmit(inputValue);
      return "handled";
    } else if (command === "cancel") {
      handleCancel();
      return "handled";
    }

    return "not-handled";
  };

  return (
    <div className="draft-editor-container" ref={wrapperNode}>
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
        placeholder={placeholder}
        ref={editorNode}
        webDriverTestID="draftjs-editor"
      />
    </div>
  );
}
