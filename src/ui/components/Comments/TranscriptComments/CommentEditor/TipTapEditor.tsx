import React, { useEffect, useState } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { User } from "ui/types";
import Placeholder from "@tiptap/extension-placeholder";
import classNames from "classnames";
import { GitHubLink } from "./githubLink";
import { ReplayLink } from "./replayLink";
import useAuth0 from "ui/utils/useAuth0";
import debounce from "lodash/debounce";
import { useGetRecordingId } from "ui/hooks/recordings";
import { commentsLocalStorage } from "./commentsLocalStorage";

const PERSIST_COMM_DEBOUNCE_DELAY = 500;

interface TipTapEditorProps {
  autofocus: boolean;
  blur: () => void;
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
  const { isAuthenticated } = useAuth0();
  const recordingId = useGetRecordingId();

  const onSubmit = (newContent: string) => {
    handleSubmit(newContent);
    blur();
    close();
  };

  const editor = useEditor(
    {
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
      onCreate: ({ editor }) => {
        if (editable) {
          const storedComment = commentsLocalStorage.getComment(recordingId);
          editor.commands.setContent(storedComment ? JSON.parse(storedComment) : null);
        }
      },
      onUpdate: debounce(({ editor }) => {
        if (editable) {
          commentsLocalStorage.setComment(recordingId, JSON.stringify(editor.getJSON()));
        }
      }, PERSIST_COMM_DEBOUNCE_DELAY),
      editable,
      autofocus,
    },
    [isAuthenticated]
  );

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
      onMouseDown={e => {
        if (editable) {
          e.stopPropagation();
        }
      }}
    >
      <EditorContent
        className={classNames("w-full rounded-md border p-1 outline-none transition", {
          "bg-themeBodyBgcolor": editable,
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
