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
import * as Sentry from "@sentry/react";
import {
  $createParagraphNode,
  $getRoot,
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
import { useCallback, useEffect, useMemo, useRef } from "react";

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

      const json = JSON.parse(initialValue) as any;
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

  useEffect(() => {
    if (serializedEditorState) {
      const editor = editorRef.current;
      if (editor != null) {
        // Avoid triggering React warning:
        // flushSync was called from inside a lifecycle method.
        // React cannot flush when React is already rendering.
        // Consider moving this call to a scheduler task or micro task.
        Promise.resolve().then(() => {
          try {
            const editorState = editor.parseEditorState(serializedEditorState);
            editor.setEditorState(editorState);
          } catch (error) {
            console.error("Error parsing saved comment state:", serializedEditorState, error);
            Sentry.captureException(error, { extra: { serializedEditorState } });
          }
        });
      }
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
    }
  }, []);

  const onFormSubmit = useCallback((editorState: EditorState) => {
    const { onDelete, onSave } = committedStateRef.current;

    const textContent = serialize(editorState);
    if (textContent.trim() === "") {
      onDelete();
    } else {
      onSave(editorState.toJSON());

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
  }, [onFormSubmit]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const element = editor.getRootElement();
      if (element) {
        if (dataTestId) {
          element.setAttribute("data-test-id", dataTestId);
        } else {
          element.removeAttribute("data-test-id");
        }

        if (dataTestName) {
          element.setAttribute("data-test-name", dataTestName);
        } else {
          element.removeAttribute("data-test-name");
        }
      }
    }
  }, [editorRef, dataTestId, dataTestName]);

  return (
    <div className={styles.Editor}>
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
