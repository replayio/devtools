import { MarkNode } from "@lexical/mark";
import {
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $getTextContent,
  BLUR_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  Klass,
  LexicalEditor,
  LexicalNode,
  LineBreakNode,
  ParagraphNode,
  SerializedEditorState,
  TextNode,
} from "lexical";
import { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";

import LexicalEditorRefSetter from "./LexicalEditorRefSetter";
import { AutoLinkNode } from "./plugins/auto-link/AutoLinkNode";
import AutoLinkPlugin from "./plugins/auto-link/AutoLinkPlugin";
import CommentPlugin from "./plugins/comment/CommentPlugin";
import parseMarkdownString from "./plugins/comment/utils/parseMarkdownString";
import parseTipTapJson from "./plugins/comment/utils/parseTipTapJson";
import rangesToLexicalNodes from "./plugins/comment/utils/rangesToLexicalNodes";
import serialize from "./plugins/comment/utils/serialize";
import FormPlugin from "./plugins/form/FormPlugin";
import { LoomLinkNode } from "./plugins/loom-link/LoomLinkNode";
import LoomLinkPlugin from "./plugins/loom-link/LoomLinkPlugin";
import MentionsPlugin from "./plugins/mentions/MentionsPlugin";
import MentionsTextNode from "./plugins/mentions/MentionsTextNode";
import { Collaborator } from "./plugins/mentions/types";
import styles from "./styles.module.css";
import { debug } from "console";

// The comment editor only supports a subset of markdown formatting.
const MARKDOWN_TRANSFORMERS = [
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
];

const NODES: Array<Klass<LexicalNode>> = [
  AutoLinkNode,
  LineBreakNode,
  LoomLinkNode,
  MarkNode,
  MentionsTextNode,
  ParagraphNode,
  TextNode,
];

export default function CommentEditor({
  autoFocus,
  collaborators = null,
  dataTestId,
  dataTestName,
  editable,
  initialValue = "",
  onCancel,
  onDelete,
  onSave,
  placeholder = "",
}: {
  autoFocus?: boolean;
  collaborators?: Collaborator[] | null;
  dataTestId?: string;
  dataTestName?: string;
  editable: boolean;
  initialValue: string;
  onCancel: () => void;
  onDelete: () => void;
  onSave: (editorState: SerializedEditorState) => void;
  placeholder: string;
}): JSX.Element {
  const historyState = useMemo(() => createEmptyHistoryState(), []);

  const editorRef = useRef<LexicalEditor>(null);
  const backupEditorStateRef = useRef<EditorState | null>(null);

  // Shares most recently committed component state with imperative Lexical API (which only runs on mount)
  const committedStateRef = useRef({
    onCancel,
    onDelete,
    onSave,
  });
  useEffect(() => {
    committedStateRef.current.onCancel = onCancel;
    committedStateRef.current.onDelete = onDelete;
    committedStateRef.current.onSave = onSave;
  });

  const [markdown, serializedEditorState] = useMemo(() => {
    try {
      if (initialValue === "") {
        return [initialValue, null];
      }

      const json = JSON.parse(initialValue);
      if (json.type === "doc") {
        // Legacy (TipTap) JSON content format.
        // Convert to Markdown string for initial parse.
        return [parseTipTapJson(json), null];
      } else {
        // Modern (Lexical) markdown format (JSON-serialized EditorState).
        return [null, json];
      }
    } catch (error) {
      console.error(`Error parsing saved comment state: "${initialValue}"`, error);

      // Assume markdown string as fallback.
      return [initialValue, null];
    }
  }, [initialValue]);

  const separated = serializedEditorState.root.children[0].children[0].text?.slice(0, 2) || "3&";

  const infoStyles = [
    ["Bug", "bug_report", styles.bugStyle],
    ["Breadscrumb", "hdr_strong", styles.breadcrumbsStyle],
    ["Question", "question_mark", styles.questionStyle],
    ["Info", "sms", styles.infoStyle],
  ];

  const styleDefined = separated[1] == "&" ? parseInt(separated[0]) : 3;

  const [styleComment, setStyleComment] = useState([
    infoStyles[styleDefined][0],
    infoStyles[styleDefined][1],
    infoStyles[styleDefined][2],
    styleDefined,
  ]);

  useEffect(() => {
    try {
      if (serializedEditorState) {
        const editor = editorRef.current;
        if (editor != null) {
          // Avoid triggering React warning:
          // flushSync was called from inside a lifecycle method.
          // React cannot flush when React is already rendering.
          // Consider moving this call to a scheduler task or micro task.
          Promise.resolve().then(() => {
            const editorState = editor.parseEditorState(serializedEditorState);
            editor.setEditorState(editorState);
          });
        }
      }
    } catch (error) {
      console.error("Error parsing saved comment state:", serializedEditorState);
      console.error(error);
    }
  }, [editorRef, serializedEditorState]);

  // Toggle editor's enabled state when the prop changes.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor != null) {
      if (editor.isEditable() !== editable) {
        editor.setEditable(editable);

        if (editable) {
          setTimeout(() => {
            editor.focus();
          });
        }
      }
    }
  }, [editable]);

  // Save a backup of the editor state in case we need to cancel/discard pending changes.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      if (editable) {
        backupEditorStateRef.current = editor.getEditorState();
      }
    }
  }, [editable, editorRef]);

  const onFormCancel = useCallback((_: EditorState) => {
    const { onCancel } = committedStateRef.current;

    onCancel();

    const editor = editorRef.current;
    if (editor) {
      editor.update(() => {
        const editorState = backupEditorStateRef.current;
        if (editorState) {
          editor.setEditorState(editorState);
        }
      });
      editor.setEditable(false);
    }
  }, []);

  const onFormSubmit = useCallback(async (editorState: EditorState) => {
    const { onDelete, onSave } = committedStateRef.current;

    const textContent = serialize(editorState);
    if (textContent.trim() === "") {
      onDelete();
    } else {
      const editor = editorRef.current;
      // const editor2 = await saveStyle(editor, textContent);
      // const newEditorState = editor2?.getEditorState();
      // console.log(editorState)
      onSave(editorState.toJSON());

      if (editor) {
        editor.setEditable(false);
      }

      backupEditorStateRef.current = editorState;
    }
  }, []);

  // Discard pending changes on-blur;
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const onBlurCommand = (event: FocusEvent) => {
        if (event.defaultPrevented) {
          return false;
        }

        if (editor.isEditable()) {
          event.preventDefault();
          onFormSubmit(editor.getEditorState());
          return true;
        }

        return false;
      };

      return editor.registerCommand(BLUR_COMMAND, onBlurCommand, COMMAND_PRIORITY_NORMAL);
    }
  }, [onFormSubmit, styleComment]);

  const handlerStyle: MouseEventHandler = event => {
    event.currentTarget.parentElement?.lastElementChild?.classList.replace("hidden", "flex");
  };

  // function styleHandlerBlur(event) {
  //   event.target.parentElement?.lastChild?.classList?.add("hidden");
  // }
  const changeStyle: MouseEventHandler = event => {
    event.stopPropagation();
    const parent = event.currentTarget.parentElement as HTMLElement;
    const style = parseInt(event.currentTarget.getAttribute("data-style") as string);
    parent.classList.add("hidden");
    const children = parent.children;
    [0, 1, 2, 3].forEach(i => {
      children[i].classList.remove("bg-gray-200");
    });
    event.currentTarget.classList.add("bg-gray-200");

    // Save in text Implementation

    const editor = editorRef.current;
    editor?.update(() => {
      const selection = $getRoot().getAllTextNodes()[0]
      console.log(selection)
      const content = selection.getTextContent();
      if (content?.slice(1, 2) == "&") {
        selection?.setTextContent(style + "&" + content?.slice(2));
      } else {
        selection?.setTextContent(style + "&" + content);
      }
    });

    const newBase = [
      commentStyle[style][0],
      commentStyle[style][1],
      commentStyle[style][2],
      style,
    ]
    setStyleComment(newBase);
    console.log(styleComment)
  };
  // const styleTagStyle = "flex w-full items-center justify-between py-1 px-3 font-medium border";
  const styleTagStyle = "flex max-w-fit items-center gap-2 rounded-full px-3 py-1 border  ";
  const commentStyle = [
    ["Bug", "bug_report", styles.bugStyle],
    ["Breadscrumb", "hdr_strong", styles.breadcrumbsStyle],
    ["Question", "question_mark", styles.questionStyle],
    ["Info", "sms", styles.infoStyle],
  ];

  return (
    <div className={styles.Editor}>
      <div className="relative mb-2 flex rounded-md text-[.625rem] text-zinc-600">
        <button
          disabled={false}
          type="button"
          onClick={handlerStyle}
          className={styleTagStyle + styleComment[2]}
        >
          <span>{styleComment[0]}</span>
          <span className="material-icons-outlined text-sm">{styleComment[1]}</span>
        </button>
        <ul className="absolute top-0 z-10 hidden w-full flex-col justify-center overflow-hidden rounded-md bg-white text-xs shadow-xl">
          <li
            className="w-full py-2 text-center hover:bg-gray-100"
            data-style="0"
            onClick={changeStyle}
          >
            Bug
          </li>
          <li
            className="w-full py-2  text-center hover:bg-gray-100"
            data-style="1"
            onClick={changeStyle}
          >
            Breadscrumb
          </li>
          <li
            className="w-full py-2  text-center hover:bg-gray-100"
            data-style="3"
            onClick={changeStyle}
          >
            Info
          </li>
          <li
            className="w-full py-2  text-center hover:bg-gray-100"
            data-style="2"
            onClick={changeStyle}
          >
            Question
          </li>
        </ul>
      </div>
      <LexicalComposer initialConfig={createInitialConfig(markdown, editable)}>
        <LexicalEditorRefSetter editorRef={editorRef} />
        <>
          {autoFocus && <AutoFocusPlugin />}
          <HistoryPlugin externalHistoryState={historyState} />
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.ContentEditable} />}
            placeholder={<div className={styles.Placeholder}>{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
          <FormPlugin onCancel={onFormCancel} onSubmit={onFormSubmit} />
          <CommentPlugin />
          <LoomLinkPlugin />
          <AutoLinkPlugin />
          {collaborators !== null ? (
            <MentionsPlugin
              collaborators={collaborators}
              dataTestId={dataTestId ? `${dataTestId}-CodeTypeAhead` : undefined}
              dataTestName={dataTestName ? `${dataTestName}-CodeTypeAhead` : "CodeTypeAhead"}
            />
          ) : null}
        </>
      </LexicalComposer>
    </div>
  );
}

function createInitialConfig(markdown: string | null, editable: boolean) {
  return {
    editable,
    editorState: () => {
      const root = $getRoot();
      if (root.getFirstChild() === null) {
        if (markdown !== null) {
          const ranges = parseMarkdownString(markdown);
          root.append(...rangesToLexicalNodes(ranges));
        } else {
          root.append($createParagraphNode());
        }
      }
    },
    namespace: "CommentEditor",
    nodes: NODES,
    onError: (error: Error) => {
      throw error;
    },
    theme: LexicalTheme,
  };
}

const LexicalTheme = {
  text: {
    bold: styles.LexicalBold,
    code: styles.LexicalCode,
    italic: styles.LexicalItalic,
    strikethrough: styles.LexicalStrikethrough,
    underline: styles.LexicalUnderline,
    underlineStrikethrough: styles.LexicalUnderlineStrikethrough,
  },
};
