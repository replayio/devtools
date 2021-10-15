import React, { useEffect } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { User } from "ui/types";
import Placeholder from "@tiptap/extension-placeholder";
import classNames from "classnames";

interface TipTapEditorProps {
  content: string;
  editable: boolean;
  handleSubmit: (text: string) => void;
  handleCancel: () => void;
  placeholder: string;
  // Not actually implementing this now, but leaving it in the API for later
  possibleMentions: User[];
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
  content,
  editable,
  handleSubmit,
  handleCancel,
  placeholder,
}: TipTapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      // Mention.configure({ suggestion: suggestion(possibleMentions.map(u => u.name)) }),
      Placeholder.configure({ placeholder }),
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
            Escape: () => {
              handleCancel();
              return true;
            },
          };
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
    content: tryToParse(content),
    editable,
    autofocus: true,
  });

  useEffect(() => {
    editor?.setEditable(editable);
    if (editable) {
      editor?.commands.focus("end");
    }
  }, [editable]);

  return (
    <EditorContent
      className={classNames("outline-none w-full rounded-md py-1 px-2 transition", {
        "border-gray-400": editable,
        "bg-white": editable,
        border: editable,
      })}
      editor={editor}
    />
  );
};

export default TipTapEditor;
