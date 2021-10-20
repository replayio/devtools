import React, { useEffect } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import Mention from "@tiptap/extension-mention";
import StarterKit from "@tiptap/starter-kit";
import suggestion from "./mentionSuggestion";
import Placeholder from "@tiptap/extension-placeholder";
import classNames from "classnames";

interface TipTapEditorProps {
  autofocus: boolean;
  blur: () => void;
  content: string;
  editable: boolean;
  handleSubmit: (text: string) => void;
  handleCancel: () => void;
  placeholder: string;
  takeFocus: boolean;
}

const tryToParse = (content: string): any => {
  try {
    return JSON.parse(content);
  } catch {
    // Our comments were not always JSON, they used to be stored as markdown
    // In that case, we just render the raw markdown.
    const textContent = content ? [{ type: "text", text: content }] : [];
    return {
      type: "doc",
      content: [{ type: "paragraph", content: textContent }],
    };
  }
};

const TipTapEditor = ({
  autofocus,
  blur,
  content,
  editable,
  handleSubmit,
  handleCancel,
  placeholder,
  takeFocus,
}: TipTapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Extension.create({
        name: "submitOnEnter",
        addKeyboardShortcuts() {
          return {
            "Cmd-Enter": ({ editor }) => {
              handleSubmit(JSON.stringify(editor.getJSON()));
              return true;
            },
            Enter: ({ editor }) => {
              handleSubmit(JSON.stringify(editor.getJSON()));
              return true;
            },
            Escape: ({ editor }) => {
              editor.commands.blur();
              handleCancel();
              return true;
            },
          };
        },
      }),
      Mention.configure({ suggestion: suggestion([]), HTMLAttributes: { class: "font-bold" } }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
    content: tryToParse(content),
    editable,
    autofocus,
  });

  useEffect(() => {
    editor?.setEditable(editable);
    if (editable) {
      editor?.commands.focus("end");
    }
  }, [editable]);

  useEffect(() => {
    if (takeFocus) {
      editor?.commands.focus("end");
    }
  }, [takeFocus]);

  return (
    <EditorContent
      className={classNames("outline-none w-full rounded-md py-1 px-2 transition", {
        "bg-white": editable,
        "border-gray-400": editable,
        "cursor-text": editable,
        border: editable,
      })}
      editor={editor}
      onBlur={blur}
    />
  );
};

export default TipTapEditor;
