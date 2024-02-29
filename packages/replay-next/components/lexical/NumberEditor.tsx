import assert from "assert";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin, createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { $rootTextContent } from "@lexical/text";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  EditorState,
  Klass,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  TextNode,
} from "lexical";
import {
  ForwardedRef,
  HTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { useContentEditableNoUserSelect } from "replay-next/components/lexical/hooks/useContentEditableNoUserSelect";
import LexicalEditorRefSetter from "replay-next/components/lexical/LexicalEditorRefSetter";
import NumberPlugin from "replay-next/components/lexical/plugins/number/NumberPlugin";
import { parseNumberFromTextContent } from "replay-next/components/lexical/plugins/number/utils/parseNumberFromTextContent";
import { updateEditorValue } from "replay-next/components/lexical/plugins/number/utils/updateEditorValue";

import FormPlugin from "./plugins/form/FormPlugin";
import styles from "./styles.module.css";

const NODES: Array<Klass<LexicalNode>> = [ParagraphNode, TextNode];

export interface NumberEditorHandle {
  getValue(): number | undefined;
  setValue: (value: number) => void;
}

type Props = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  autoFocus?: boolean;
  defaultValue: number;
  editable?: boolean;
  disableSelectionWhenNotFocused?: boolean;
  maxValue: number;
  minValue: number;
  onCancel?: () => void;
  onSave: (value: number | undefined) => void;
  placeholder?: string;
  step?: number;
};

function NumberEditorWithForwardedRef({
  autoFocus,
  className = "",
  defaultValue,
  disableSelectionWhenNotFocused,
  editable = true,
  maxValue,
  minValue,
  onCancel,
  onSave,
  placeholder,
  forwardedRef,
  step = 1,
  ...rest
}: Props & {
  forwardedRef: ForwardedRef<NumberEditorHandle>;
}) {
  const committedValuesRef = useRef<{
    defaultValue: number;
    maxValue?: number;
    minValue?: number;
    step: number;
  }>({
    defaultValue,
    maxValue,
    minValue,
    step,
  });
  useEffect(() => {
    committedValuesRef.current.defaultValue = defaultValue;
    committedValuesRef.current.maxValue = maxValue;
    committedValuesRef.current.minValue = minValue;
    committedValuesRef.current.step = step;
  });

  const historyState = useMemo(() => createEmptyHistoryState(), []);

  assert(
    minValue == null || maxValue == null || minValue <= maxValue,
    `Invalid minValue (${minValue}) and maxValue (${maxValue}) props`
  );

  const editorRef = useRef<LexicalEditor>(null);
  const backupEditorStateRef = useRef<EditorState | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => ({
      getValue: () => {
        const { maxValue, minValue, step } = committedValuesRef.current;

        const editor = editorRef.current;
        assert(editor !== null, "Editor is not initialized");

        const editorState = editor.getEditorState();

        return editorState.read(() => {
          return parseNumberFromTextContent({
            maxValue,
            minValue,
            step,
            textContent: $rootTextContent(),
          });
        });
      },
      setValue: (value: number) => {
        const editor = editorRef.current;
        assert(editor !== null, "Editor is not initialized");

        updateEditorValue(editor, value);
      },
    }),
    []
  );

  const onFormCancel = (_: EditorState) => {
    if (onCancel !== undefined) {
      onCancel();
    }

    const editor = editorRef.current;
    if (editor) {
      editor.update(() => {
        const editorState = backupEditorStateRef.current;
        if (editorState) {
          editor.setEditorState(editorState);
        }
      });
    }
  };

  const onFormSubmit = (editorState: EditorState) => {
    const { maxValue, minValue, step } = committedValuesRef.current;

    const editor = editorRef.current;
    if (editor !== null) {
      const number = parseNumberFromTextContent({
        maxValue,
        minValue,
        step,
        textContent: $rootTextContent(),
      });

      onSave(number);

      backupEditorStateRef.current = editorState;
    }
  };

  const rootElementRef = useRef<HTMLDivElement>(null);

  useContentEditableNoUserSelect(rootElementRef, {
    autoFocus: autoFocus === true,
    disableSelectionWhenNotFocused: disableSelectionWhenNotFocused === true,
  });

  return (
    <div {...rest} className={`${className} ${styles.Editor}`} ref={rootElementRef}>
      <LexicalComposer initialConfig={createInitialConfig(defaultValue, editable)}>
        <LexicalEditorRefSetter editorRef={editorRef} />
        <>
          {autoFocus && <AutoFocusPlugin />}
          <HistoryPlugin externalHistoryState={historyState} />
          <NumberPlugin
            defaultValue={defaultValue}
            minValue={minValue}
            maxValue={maxValue}
            step={step}
          />
          <PlainTextPlugin
            contentEditable={<ContentEditable className={styles.ContentEditable} />}
            placeholder={<div className={styles.Placeholder}>{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <FormPlugin onCancel={onFormCancel} onSubmit={onFormSubmit} />
        </>
      </LexicalComposer>
    </div>
  );
}

export const NumberEditor = forwardRef<NumberEditorHandle, Props>(
  (props: Props, ref: ForwardedRef<NumberEditorHandle>) => (
    <NumberEditorWithForwardedRef {...props} forwardedRef={ref} />
  )
);

NumberEditor.displayName = "NumberEditor";
NumberEditorWithForwardedRef.displayName = "forwardRef(NumberEditor)";

function createInitialConfig(defaultValue: number, editable: boolean) {
  return {
    editable,
    editorState: () => {
      const root = $getRoot();
      if (root.getFirstChild() === null) {
        const paragraphNode = $createParagraphNode();
        paragraphNode.append($createTextNode("" + defaultValue));

        root.append(paragraphNode);
      }
    },
    namespace: "NumberEditor",
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
