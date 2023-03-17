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
  $getNodeByKey,
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
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
          // const editorState = editor.getEditorState()
          // editorState.read(()=>{
          //   const texto = $getRoot()
          //   console.log(texto.__cachedText)
          // })
          // debugger
        }

        const separated = serializedEditorState.root.children[0].children[0].text.slice(-2)
        if(separated[0] == '&'){
          const styleDefined = parseInt(separated[1])
          setStyleComment([
            commentStyle[styleDefined][0],
            commentStyle[styleDefined][1],
            commentStyle[styleDefined][2],
            styleDefined,
          ]);

        }
        console.log(separated)
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

  const saveStyle =async (editor: LexicalEditor | null, textContent: string) => {
    await editor?.update(() => {

      const selection = $getSelection();
      const i1 = selection?.getNodes()[0]
      const content = i1?.getTextContent()
      if(content?.slice(1,2) == "&"){
        i1?.replace($createTextNode( styleComment[3]+'&'+ content?.slice(2) ))
      }
      console.log(i1?.getTextContent())

      // paragraph?.append($createTextNode('&'+styleComment[3] as string))

      // textnode?.setTextContent("ahoy");
      // console.log(paragraph?.getType());
      // paragraph?.setTextContent("hola")
      // texto?.setTextContent('hola')
      // const awe = content[0].length
      // if( awe?[0].length  === 1) {
      //   textNode?.setTextContent(`${styleComment[3]}&_&${content?[1]}`);
    });
    debugger
    return editor;
  };

  const onFormSubmit = useCallback(async (editorState: EditorState) => {
    const { onDelete, onSave } = committedStateRef.current;
    const textContent = serialize(editorState);
    // console.log(serializedEditorState)
    if (textContent.trim() === "") {
      onDelete();
    } else {
      const editor = editorRef.current;

      // const removeTransform = editor?.registerNodeTransform(ParagraphNode, (paragraph) => {
      //   const texto = paragraph.getTextContent()
      //   console.log('logrado', texto)
      // });

      const editor2 = await saveStyle(editor, textContent);
      const newEditorState = editor2?.getEditorState();
      // })
      // textNode?.append($createTextNode("dos"))
      // console.log(textNode)

      //   // text?.split('&')[0].length == 1

      //   const texto = $createTextNode(styleComment[0])
      //   const styleId = $createParagraphNode()
      //   styleId.append(texto)

      //   root.append(styleId)
      //   debugger

      // editor?.update(()=>{
      // })

      // console.log(editorState)
      onSave(newEditorState.toJSON());

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
  }, [onFormSubmit]);

  function handlerStyle(event) {
    console.log(event.target.parentElement.lastChild);
    event.target.parentElement.lastChild?.classList?.remove("hidden");
  }
  function styleHandlerBlur(event) {
    event.target.parentElement?.lastChild?.classList?.add("hidden");
  }
  const changeStyle: MouseEventHandler = event => {
    const style = event.target.dataset.style;
    setStyleComment([
      commentStyle[style][0],
      commentStyle[style][1],
      commentStyle[style][2],
      style,
    ]);
    event.target.parentElement.classList.add("hidden");
    event.target.parentElement.parentElement.firstChild.classList =
      styleTagStyle + commentStyle[style][2];
  };
  // const styleTagStyle = "flex w-full items-center justify-between py-1 px-3 font-medium border";
  const styleTagStyle = "flex max-w-fit items-center gap-2 rounded-full px-3 py-1 border";
  const commentStyle = [
    ["Bug", "bug_report", " bg-green-100 text-green-600 border-green-600"],
    ["Breadscrumb", "hdr_strong", " bg-yellow-100 text-yellow-600 border-yellow-600"],
    ["Question", "question_mark", " bg-red-100 text-red-600 border-red-600"],
    ["Info", "sms", " bg-gray-50 text-zinc-500 border-gray-400"],
  ];

  const stateNode = serializedEditorState;
  
  const [styleComment, setStyleComment] = useState([
    commentStyle[3][0],
    [commentStyle[3][1]],
    [commentStyle[3][2]],
    3,
  ]);

  return (
    <div>
      <div className="relative mb-1 flex rounded-md text-[.625rem] text-zinc-600">
        <button disabled={false} type="button" onClick={handlerStyle} className={styleTagStyle + styleComment[2]}>
          <span>{styleComment[0]}</span>
          <span className="material-icons-outlined text-sm">{styleComment[1]}</span>
        </button>
        <ul className="absolute top-0 z-10  mx-3 flex hidden w-full flex-col justify-center overflow-hidden rounded-md bg-white text-xs shadow-xl">
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
