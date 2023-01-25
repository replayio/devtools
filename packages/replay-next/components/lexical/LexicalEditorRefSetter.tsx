import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";
import { RefObject, useLayoutEffect } from "react";

export default function LexicalEditorRefSetter({
  editorRef,
}: {
  editorRef: RefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    // @ts-ignore
    editorRef.current = editor;
  });

  return null;
}
