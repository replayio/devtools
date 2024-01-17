import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $selectAll } from "@lexical/selection";
import { $rootTextContent } from "@lexical/text";
import { mergeRegister } from "@lexical/utils";
import { ExecutionPoint } from "@replayio/protocol";
import {
  $getRoot,
  $getSelection,
  COMMAND_PRIORITY_CRITICAL,
  EditorState,
  KEY_ENTER_COMMAND,
  Klass,
  LexicalEditor,
  LexicalNode,
  LineBreakNode,
  SELECTION_CHANGE_COMMAND,
  SerializedEditorState,
  TextNode,
} from "lexical";
import {
  ForwardedRef,
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import LexicalEditorRefSetter from "./LexicalEditorRefSetter";
import CodeCompletionPlugin from "./plugins/code-completion/CodeCompletionPlugin";
import { Context } from "./plugins/code-completion/findMatches";
import CodeNode from "./plugins/code/CodeNode";
import CodePlugin from "./plugins/code/CodePlugin";
import parsedTokensToCodeTextNode from "./plugins/code/utils/parsedTokensToCodeTextNode";
import parseTokens from "./plugins/code/utils/parseTokens";
import FormPlugin from "./plugins/form/FormPlugin";
import styles from "./styles.module.css";

// Diffing is simplest when the Code plug-in has a flat structure.
const NODES: Array<Klass<LexicalNode>> = [LineBreakNode, CodeNode, TextNode];

export type ImperativeHandle = {
  focus: () => void;
};

type Props = {
  allowWrapping?: boolean;
  autoFocus?: boolean;
  autoSelect?: boolean;
  context: Context;
  dataTestId?: string;
  dataTestName?: string;
  editable: boolean;
  executionPoint: ExecutionPoint | null;
  forwardedRef?: ForwardedRef<ImperativeHandle>;
  initialValue: string;
  onCancel?: () => void;
  onChange?: (markdown: string, editorState: SerializedEditorState) => void;
  onSave: (markdown: string, editorState: SerializedEditorState) => void;
  placeholder?: string;
  preventTabFocusChange?: boolean;
  time: number;
};

function CodeEditor({
  allowWrapping = true,
  autoFocus = false,
  autoSelect = false,
  context,
  dataTestId,
  dataTestName,
  editable,
  executionPoint,
  forwardedRef,
  initialValue,
  onCancel,
  onChange,
  onSave,
  placeholder = "",
  preventTabFocusChange = false,
  time,
}: Props): JSX.Element {
  const historyState = useMemo(() => createEmptyHistoryState(), []);

  const editorRef = useRef<LexicalEditor>(null);
  const backupEditorStateRef = useRef<EditorState | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus() {
        editorRef.current?.focus();
      },
    }),
    []
  );

  const didMountRef = useRef(false);
  useLayoutEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;

      if (autoSelect) {
        const editor = editorRef.current;
        if (editor) {
          editor.update(() => {
            const root = $getRoot();
            const firstChild = root.getFirstChild();
            if (firstChild) {
              const selection = firstChild.select(0, 0);
              $selectAll(selection);
            }
          });
        }
      }
    }
  }, [autoSelect]);

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

        // Make sure the cursor is visible (if there is overflow)
        const onSelectionChange = () => {
          const selection = $getSelection();
          if (selection) {
            const nodes = selection.getNodes();
            if (nodes?.length > 0) {
              const node = nodes[0];
              const element = editor.getElementByKey(node.__key);
              if (element) {
                element.scrollIntoView({ block: "nearest", inline: "nearest" });
              }
            }
          }

          return false;
        };

        return mergeRegister(
          editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            onSelectionChange,
            COMMAND_PRIORITY_CRITICAL
          ),
          editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_CRITICAL)
        );
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
        <CodePlugin preventTabFocusChange={preventTabFocusChange} />
        <CodeCompletionPlugin
          context={context}
          dataTestId={dataTestId ? `${dataTestId}-CodeTypeAhead` : undefined}
          dataTestName={dataTestName ? `${dataTestName}-CodeTypeAhead` : undefined}
          executionPoint={executionPoint}
          time={time}
        />
      </>
    </LexicalComposer>
  );
}

const CodeEditorForwardRef = forwardRef<ImperativeHandle, Props>(
  (props: Props, ref: ForwardedRef<ImperativeHandle>) =>
    createElement(CodeEditor, { ...props, forwardedRef: ref })
);
CodeEditorForwardRef.displayName = "ForwardRef<CodeEditor>";

export default CodeEditorForwardRef;

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
