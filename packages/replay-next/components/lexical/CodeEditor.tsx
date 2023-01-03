import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $rootTextContent } from "@lexical/text";
import {
  $getRoot,
  COMMAND_PRIORITY_CRITICAL,
  EditorState,
  KEY_ENTER_COMMAND,
  Klass,
  LexicalEditor,
  LexicalNode,
  LineBreakNode,
  SerializedEditorState,
  TextNode,
} from "lexical";
import { useEffect, useMemo, useRef } from "react";

import { PauseAndFrameId } from "replay-next/src/contexts/SelectedFrameContext";

import LexicalEditorRefSetter from "./LexicalEditorRefSetter";
import CodeCompletionPlugin from "./plugins/code-completion/CodeCompletionPlugin";
import CodeNode from "./plugins/code/CodeNode";
import CodePlugin from "./plugins/code/CodePlugin";
import parsedTokensToCodeTextNode from "./plugins/code/utils/parsedTokensToCodeTextNode";
import parseTokens from "./plugins/code/utils/parseTokens";
import FormPlugin from "./plugins/form/FormPlugin";
import styles from "./styles.module.css";

// Diffing is simplest when the Code plug-in has a flat structure.
const NODES: Array<Klass<LexicalNode>> = [LineBreakNode, CodeNode, TextNode];

export default function CodeEditor({
  allowWrapping = true,
  autoFocus = false,
  dataTestId,
  dataTestName,
  editable,
  initialValue,
  onCancel,
  onChange,
  onSave,
  pauseAndFrameId,
  placeholder = "",
}: {
  allowWrapping?: boolean;
  autoFocus?: boolean;
  dataTestId?: string;
  dataTestName?: string;
  editable: boolean;
  initialValue: string;
  onCancel?: () => void;
  onChange?: (markdown: string, editorState: SerializedEditorState) => void;
  onSave: (markdown: string, editorState: SerializedEditorState) => void;
  pauseAndFrameId: PauseAndFrameId | null;
  placeholder?: string;
}): JSX.Element {
  const historyState = useMemo(() => createEmptyHistoryState(), []);

  const editorRef = useRef<LexicalEditor>(null);
  const backupEditorStateRef = useRef<EditorState | null>(null);

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

  const onFormCancel = (_: EditorState) => {
    if (onCancel === undefined) {
      return;
    }

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
  };

  const onFormChange = (editorState: EditorState) => {
    if (typeof onChange === "function") {
      const editor = editorRef.current;
      if (editor !== null) {
        editorState.read(() => {
          const textContent = $rootTextContent();
          onChange(textContent, editorState.toJSON());
        });
      }
    }
  };

  useEffect(() => {
    if (!allowWrapping) {
      const editor = editorRef.current;
      if (editor) {
        const onEnter = (event: KeyboardEvent) => {
          if (event.shiftKey) {
            event.preventDefault();
            return true;
          }

          return false;
        };

        return editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_CRITICAL);
      }
    }
  }, [allowWrapping, editorRef]);

  const onFormSubmit = (editorState: EditorState) => {
    const editor = editorRef.current;
    if (editor !== null) {
      const textContent = $rootTextContent();
      onSave(textContent, editorState.toJSON());

      backupEditorStateRef.current = editorState;
    }
  };

  return (
    <LexicalComposer initialConfig={createInitialConfig(initialValue, editable)}>
      <>
        <LexicalEditorRefSetter editorRef={editorRef} />
        {autoFocus && <AutoFocusPlugin />}
        <HistoryPlugin externalHistoryState={historyState} />
        <RichTextPlugin
          contentEditable={<ContentEditable className={styles.ContentEditable} />}
          placeholder={<div className={styles.Placeholder}>{placeholder}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <FormPlugin onCancel={onFormCancel} onChange={onFormChange} onSubmit={onFormSubmit} />
        <CodePlugin />
        <CodeCompletionPlugin
          dataTestId={dataTestId ? `${dataTestId}-CodeTypeAhead` : undefined}
          dataTestName={dataTestName ? `${dataTestName}-CodeTypeAhead` : undefined}
          pauseAndFrameId={pauseAndFrameId}
        />
      </>
    </LexicalComposer>
  );
}

function createInitialConfig(code: string, editable: boolean) {
  return {
    editable,
    editorState: () => {
      const root = $getRoot();
      if (root.getFirstChild() === null) {
        const tokens = parseTokens(code);
        if (tokens !== null) {
          const node = parsedTokensToCodeTextNode(tokens);
          root.append(node);
        }
      }
    },
    namespace: "CodeEditor",
    nodes: NODES,
    onError: (error: Error) => {
      throw error;
    },
    theme: LexicalTheme,
  };
}

// The Code editor has its own built-in styling.
// It does not rely on Lexical's rich text theme.
const LexicalTheme = {};
