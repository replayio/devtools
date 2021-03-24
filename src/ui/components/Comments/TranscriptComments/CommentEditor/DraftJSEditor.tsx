import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, KeyBindingUtil, getDefaultKeyBinding } from "draft-js";
import PluginEditor, { EditorPlugin } from "@draft-js-plugins/editor";
import { EmojiPlugin } from "@draft-js-plugins/emoji";
import "draft-js/dist/Draft.css";
import "@draft-js-plugins/emoji/lib/plugin.css";
import "@draft-js-plugins/mention/lib/plugin.css";

import { User } from "ui/types";

import { addMentions } from "./mention";

import "./DraftJSEditor.css";

interface UseEditorConfig {
  DraftJS: {
    getDefaultKeyBinding: typeof getDefaultKeyBinding;
    KeyBindingUtil: typeof KeyBindingUtil;
  };
  Editor: typeof PluginEditor;
  emojiPlugin: EmojiPlugin;
  mentionPlugin: EditorPlugin;
}

export interface UseEditorResult {
  config?: UseEditorConfig;
  editorState?: EditorState;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
}

export function useEditor({
  content = "",
  users,
}: {
  content: string;
  users?: User[];
}): UseEditorResult {
  const [editorState, setEditorState] = useState<EditorState>();
  const [config, setConfig] = useState<UseEditorConfig>();

  useEffect(
    function importDraftJS() {
      if (!users) return;

      Promise.all([
        import("draft-js"),
        import("@draft-js-plugins/editor"),
        import("@draft-js-plugins/emoji"),
        import("@draft-js-plugins/mention"),
      ]).then(
        ([
          DraftJS,
          EditorModule,
          { default: createEmojiPlugin, defaultTheme: defaultEmojiTheme },
          { default: createMentionPlugin, defaultTheme: defaultMentionTheme },
        ]) => {
          const es = addMentions(DraftJS, EditorModule.createEditorStateWithText(content), users);

          setEditorState(es);
          setConfig({
            DraftJS,
            Editor: EditorModule.default,
            emojiPlugin: createEmojiPlugin({
              theme: {
                ...defaultEmojiTheme,
                emojiSuggestions: `${defaultEmojiTheme.emojiSuggestions} pluginPopover`,
              },
            }),
            mentionPlugin: createMentionPlugin({
              entityMutability: "IMMUTABLE",
              theme: {
                ...defaultMentionTheme,
                mentionSuggestions: `${defaultMentionTheme.mentionSuggestions} pluginPopover`,
              },
            }),
          });
        }
      );
    },
    [users]
  );

  return {
    config,
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
  Editor: typeof PluginEditor;
  editorState: EditorState;
  emojiPlugin?: any;
  initialContent: string;
  mentionPlugin?: any;
  placeholder: string;
  setEditorState: UseEditorResult["setEditorState"];
  handleSubmit: (editorState: EditorState) => void;
  handleCancel: () => void;
  users: User[];
}

export default function DraftJSEditor({
  DraftJS,
  Editor,
  editorState,
  emojiPlugin,
  handleCancel,
  handleSubmit,
  mentionPlugin,
  placeholder,
  setEditorState,
  users,
}: DraftJSEditorProps) {
  const editorNode = useRef<PluginEditor>(null);
  const wrapperNode = useRef<HTMLDivElement>(null);
  const [mentionSearchText, setMentionSearchText] = useState("");
  const [open, setOpen] = useState(false);
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
      handleSubmit(editorState);
      return "handled";
    } else if (command === "cancel") {
      handleCancel();
      return "handled";
    }

    return "not-handled";
  };

  const { EmojiSuggestions } = emojiPlugin;
  const { MentionSuggestions } = mentionPlugin;

  const filteredUsers = useMemo(
    () =>
      users &&
      users.filter(
        u => u.name.includes(mentionSearchText) || u.nickname.includes(mentionSearchText)
      ),
    [mentionSearchText, users]
  );

  return (
    <div className="draft-editor-container" ref={wrapperNode}>
      <Editor
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
        placeholder={placeholder}
        plugins={[emojiPlugin, mentionPlugin]}
        ref={editorNode}
        webDriverTestID="draftjs-editor"
      />
      <EmojiSuggestions />
      <MentionSuggestions
        suggestions={filteredUsers}
        onSearchChange={({ value }: { trigger: string; value: string }) =>
          setMentionSearchText(value)
        }
        onOpenChange={setOpen}
        open={open}
      />
    </div>
  );
}
