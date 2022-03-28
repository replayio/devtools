import React from "react";
import { useEditor, EditorContent, Extension, Editor, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import classNames from "classnames";
import { GitHubLink } from "./githubLink";
import { ReplayLink } from "./replayLink";

interface TipTapEditorProps {
  content: JSONContent;
  placeholder?: string;
  editable?: boolean;
  autofocus?: boolean;
  blur?: () => void;
  close?: () => void;
  handleConfirm?: (content: JSONContent) => void;
  handleCancel?: () => void;
  onCreate?: (editor: { editor: Pick<Editor, "commands"> }) => void;
  onUpdate?: (editor: { editor: Pick<Editor, "getJSON"> }) => void;
}

const TipTapEditor = ({
  autofocus,
  blur,
  close,
  content,
  editable = false,
  handleConfirm,
  handleCancel,
  placeholder = "",
  onCreate = () => {},
  onUpdate = () => {},
}: TipTapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      GitHubLink,
      ReplayLink,
      // Mention.configure({ suggestion: suggestion(possibleMentions.map(u => u.name)) }),
      Placeholder.configure({ placeholder }),
      Extension.create({
        name: "submitOnEnter",
        addKeyboardShortcuts() {
          return {
            "Cmd-Enter": ({ editor }) => {
              handleConfirm?.(editor.getJSON());
              return true;
            },
            Enter: ({ editor }) => {
              handleConfirm?.(editor.getJSON());
              return true;
            },
            Escape: ({ editor }) => {
              editor.commands.blur();
              editor.commands.setContent(content);
              handleCancel?.();
              return true;
            },
          };
        },
      }),
    ],
    editorProps: { attributes: { class: "focus:outline-none" } },
    content,
    onCreate,
    onUpdate,
    editable,
    autofocus,
  });

  return (
    <div
      className="w-full"
      onMouseDown={e => {
        if (editable) {
          e.stopPropagation();
        }
      }}
    >
      <EditorContent
        className={classNames("w-full rounded-md border p-1 outline-none transition", {
          "cursor-text border-gray-400 bg-bodyBgcolor": editable,
          "border-transparent": !editable,
        })}
        editor={editor}
        onBlur={() => {
          blur?.();
          if ((editor?.getCharacterCount() || 0) === 0) {
            close?.();
          }
        }}
      />
    </div>
  );
};

export default TipTapEditor;
