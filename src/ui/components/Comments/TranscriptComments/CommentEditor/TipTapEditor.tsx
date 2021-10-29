import React, { useEffect } from "react";
import { Editor as EditorType } from "@tiptap/core";
import { useEditor, EditorContent, Extension, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { User } from "ui/types";
import Placeholder from "@tiptap/extension-placeholder";
import classNames from "classnames";
import { GitHubLink } from "./githubLink";
import { ReplayLink } from "./replayLink";

interface TipTapEditorProps {
  autofocus: boolean;
  blur: (text: string) => void;
  close: () => void;
  content: string;
  editable: boolean;
  handleSubmit: (text: string) => void;
  handleCancel: () => void;
  placeholder: string;
  // Not actually implementing this now, but leaving it in the API for later
  possibleMentions: User[];
  takeFocus: boolean;
}

const getContent = (editor: EditorType) => {
  const charCount = editor.getCharacterCount();
  if (charCount === 0) {
    return "";
  }
  return JSON.stringify(editor.getJSON());
};

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
  close,
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
      GitHubLink,
      ReplayLink,
      // Mention.configure({ suggestion: suggestion(possibleMentions.map(u => u.name)) }),
      Placeholder.configure({ placeholder }),
      Extension.create({
        name: "submitOnEnter",
        addKeyboardShortcuts() {
          return {
            "Cmd-Enter": ({ editor }) => {
              const content = getContent(editor);
              handleSubmit(content);
              blur(content);
              close();
              return true;
            },
            Enter: ({ editor }) => {
              const content = getContent(editor);
              handleSubmit(content);
              blur(content);
              close();
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
    <div
      className="w-full"
      onClick={e => {
        if (editable) {
          e.stopPropagation();
        }
      }}
    >
      <EditorContent
        className={classNames("outline-none w-full rounded-md py-1 px-2 transition", {
          "bg-white": editable,
          "border-gray-400": editable,
          "cursor-text": editable,
          border: editable,
        })}
        editor={editor}
        onBlur={() => {
          const content = editor ? getContent(editor) : "";
          blur(content);
          if (!content) {
            close();
          }
        }}
      />
    </div>
  );
};

export default TipTapEditor;
