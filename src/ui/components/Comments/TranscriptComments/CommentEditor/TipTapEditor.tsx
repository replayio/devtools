import React, { useEffect, useMemo } from "react";
import { useEditor, EditorContent, Extension, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { User } from "ui/types";
import Placeholder from "@tiptap/extension-placeholder";
import classNames from "classnames";
import { GitHubLink } from "./githubLink";
import { ReplayLink } from "./replayLink";
import useAuth0 from "ui/utils/useAuth0";

interface TipTapEditorProps {
  autofocus: boolean;
  blur: () => void;
  close: () => void;
  content: string | object;
  editable: boolean;
  handleSubmit: (text: string) => void;
  handleCancel: () => void;
  placeholder: string;
  // Not actually implementing this now, but leaving it in the API for later
  possibleMentions: User[];
  takeFocus: boolean;
  onCreate: (editor: { editor: Pick<Editor, "commands"> }) => void;
  onUpdate: (editor: { editor: Pick<Editor, "getJSON"> }) => void;
}

const tryToParse = (content: string | object): any => {
  if (typeof content === "object") {
    return content;
  }
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
  onCreate,
  onUpdate,
}: TipTapEditorProps) => {
  const { isAuthenticated } = useAuth0();

  // Memoize the Editor config prevents unnecessary re-renders of the "@tiptap/react" editor components.
  const editorConfig = useMemo(() => {
    const onSubmit = (newContent: string) => {
      handleSubmit(newContent);
      blur();
      close();
    };

    return {
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
                onSubmit(JSON.stringify(editor.getJSON()));
                return true;
              },

              Enter: ({ editor }) => {
                onSubmit(JSON.stringify(editor.getJSON()));
                return true;
              },
              Escape: ({ editor }) => {
                editor.commands.blur();
                editor.commands.setContent(tryToParse(content));
                handleCancel();
                return true;
              },
            };
          },
        }),
      ],
      editorProps: { attributes: { class: "focus:outline-none" } },
      content: tryToParse(content),
      onCreate,
      onUpdate,
      editable,
      autofocus,
    };
  }, [
    autofocus,
    blur,
    close,
    content,
    editable,
    handleCancel,
    handleSubmit,
    onCreate,
    onUpdate,
    placeholder,
  ]);
  const editor = useEditor(editorConfig, [isAuthenticated]);

  useEffect(() => {
    editor?.setEditable(editable);
    if (editable) {
      editor?.commands.focus("end");
    }
  }, [editable, editor]);

  useEffect(() => {
    if (takeFocus) {
      editor?.commands.focus("end");
    }
  }, [editor, takeFocus]);

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
          "bg-bodyBgcolor": editable,
          "border-gray-400": editable,
          "border-transparent": !editable,
          "cursor-text": editable,
        })}
        editor={editor}
        onBlur={() => {
          blur();
          if ((editor?.getCharacterCount() || 0) === 0) {
            close();
          }
        }}
      />
    </div>
  );
};

export default TipTapEditor;
