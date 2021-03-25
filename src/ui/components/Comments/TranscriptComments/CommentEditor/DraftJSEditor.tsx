import React, { useCallback, useEffect, useRef, useState } from "react";
import { EditorState, KeyBindingUtil, getDefaultKeyBinding, Editor } from "draft-js";
import PluginEditor from "@draft-js-plugins/editor";
import { EmojiPlugin } from "@draft-js-plugins/emoji";
import "draft-js/dist/Draft.css";
import "@draft-js-plugins/emoji/lib/plugin.css";

import "./DraftJSEditor.css";

interface UseEditorConfig {
  DraftJS: {
    getDefaultKeyBinding: typeof getDefaultKeyBinding;
    KeyBindingUtil: typeof KeyBindingUtil;
  };
  Editor: typeof PluginEditor;
  emojiPlugin: EmojiPlugin;
}

export interface UseEditorResult extends Partial<UseEditorConfig> {
  editorState?: EditorState;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
}

export function useEditor(initialContent = ""): UseEditorResult {
  const [editorState, setEditorState] = useState<EditorState>();
  const [config, setConfig] = useState<UseEditorConfig>();

  useEffect(function importDraftJS() {
    Promise.all([
      import("draft-js"),
      import("@draft-js-plugins/editor"),
      import("@draft-js-plugins/emoji"),
    ]).then(([DraftJS, EditorModule, { default: createEmojiPlugin, defaultTheme }]) => {
      setEditorState(EditorModule.createEditorStateWithText(initialContent));
      setConfig({
        DraftJS,
        Editor: EditorModule.default,
        emojiPlugin: createEmojiPlugin({
          theme: {
            ...defaultTheme,
            emojiSuggestions: `${defaultTheme.emojiSuggestions} emojiSuggestions`,
          },
        }),
      });
    });
  }, []);

  return {
    ...config,
    editorState,
    setEditorState,
  };
}

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
  Editor: any;
  editorState: EditorState;
  emojiPlugin: any;
  initialContent: string;
  placeholder: string;
  setEditorState: UseEditorResult["setEditorState"];
  handleSubmit: (inputValue: string) => void;
  handleCancel: () => void;
}

export default function DraftJSEditor({
  DraftJS,
  Editor,
  editorState,
  emojiPlugin,
  handleCancel,
  handleSubmit,
  placeholder,
  setEditorState,
}: DraftJSEditorProps) {
  const editorNode = useRef<Editor>(null);
  const wrapperNode = useRef<HTMLDivElement>(null);
  const { getDefaultKeyBinding, KeyBindingUtil } = DraftJS;

  const decorator = editorState.getDecorator();
  useEffect(() => {
    // This guards against calling focus() with a stale editorNode reference
    // that doesn't yet have the emoji decorators attached.
    if (!decorator) return;

    // The order is important here — we focus the editor first before scrolling the
    // wrapper into view. Otherwise, the scrolling animation is interrupted by the focus.
    editorNode.current!.focus();
    wrapperNode.current!.scrollIntoView({ block: "center", behavior: "smooth" });
    const { bottom } = wrapperNode.current!.getBoundingClientRect();
    const { innerHeight } = window;

    // Toggle a class to render the emoji popup above the editor when close to the bottom
    wrapperNode.current!.classList.toggle("flipPopup", innerHeight - bottom < 300);

    // Move the cursor so that it's at the end of the selection instead of the beginning.
    // Which DraftJS doesn't make easy: https://github.com/brijeshb42/medium-draft/issues/71
    setEditorState(state => moveSelectionToEnd(state, DraftJS));
  }, [decorator]);

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

  const { EmojiSuggestions } = emojiPlugin;

  return (
    <div className="draft-editor-container" ref={wrapperNode}>
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
        placeholder={placeholder}
        plugins={[emojiPlugin]}
        ref={editorNode}
        webDriverTestID="draftjs-editor"
      />
      <EmojiSuggestions />
    </div>
  );
}
