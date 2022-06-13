import classNames from "classnames";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useMemo, useRef } from "react";
import { User } from "ui/types";
import { parseCommentContent } from "ui/utils/comments";
import useAuth0 from "ui/utils/useAuth0";

import { GitHubLink } from "./githubLink";
import { ReplayLink } from "./replayLink";
import styles from "./TipTapEditor.module.css";
interface TipTapEditorProps {
  // TipTap core props
  autofocus: boolean;
  content: string | object;
  editable: boolean;
  placeholder: string;
  possibleMentions: User[];

  // FocusContext pass-thru props
  blur: () => void;
  close: () => void;
  takeFocus: boolean;

  // Remark persistence props
  handleCancel: () => void;
  handleDelete: () => void;
  handleSubmit: (text: string) => void;
}

const TipTapEditor = ({
  autofocus,
  blur,
  close,
  content,
  editable,
  handleCancel,
  handleDelete,
  handleSubmit,
  placeholder,
  takeFocus,
}: TipTapEditorProps) => {
  const { isAuthenticated } = useAuth0();

  // TipTap extensions seem to have stale closure problems.
  // Even if we re-render and pass a new editor config,
  // the keyboard event handler closes over the initial content value.
  // This breaks the Escape (to cancel) functionality.
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  });

  // Memoize the Editor config prevents unnecessary re-renders of the "@tiptap/react" editor components.
  const editorConfig = useMemo(() => {
    const onSubmit = (newPlainText: string, newContent: string) => {
      if (newPlainText.trim() === "") {
        handleDelete();
      } else {
        handleSubmit(newContent);
      }

      blur();
      close();
    };

    return {
      extensions: [
        StarterKit,
        GitHubLink,
        ReplayLink,
        // Mention.configure({ suggestion: suggestion(possibleMentions.map(u => u.name)) }),
        Placeholder.configure({
          emptyNodeClass: styles.Placeholder,
          placeholder,
        }),
        Extension.create({
          name: "submitOnEnter",
          addKeyboardShortcuts() {
            return {
              "Cmd-Enter": ({ editor }) => {
                onSubmit(editor.getText(), JSON.stringify(editor.getJSON()));
                return true;
              },
              Enter: ({ editor }) => {
                onSubmit(editor.getText(), JSON.stringify(editor.getJSON()));
                return true;
              },
              Escape: ({ editor }) => {
                editor.commands.blur();

                const mostRecentlySavedContent = contentRef.current;
                editor.commands.setContent(parseCommentContent(mostRecentlySavedContent));

                handleCancel();
                return true;
              },
            };
          },
        }),
      ],
      editorProps: { attributes: { class: "focus:outline-none" } },
      content: parseCommentContent(content),
      editable,
      autofocus,

      // TipTap requires these callbacks; it does not check if they are undefined.
      onCreate: () => {},
      onUpdate: () => {},
    };
  }, [
    autofocus,
    blur,
    close,
    content,
    editable,
    handleCancel,
    handleDelete,
    handleSubmit,
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
          if (editor?.getText().trim() === "") {
            handleDelete();
          } else {
            handleSubmit(JSON.stringify(editor?.getJSON()));
          }

          blur();
          close();
        }}
      />
    </div>
  );
};

export default TipTapEditor;
