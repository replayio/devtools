import { LexicalEditor } from "lexical";

export default function getLexicalEditorForDomNode(domNode: Node): LexicalEditor | null {
  let currentDomNode: Node | null = domNode;
  while (currentDomNode != null) {
    // @ts-expect-error: internal field
    const maybeLexicalEditor = currentDomNode.__lexicalEditor;
    if (maybeLexicalEditor != null) {
      return maybeLexicalEditor;
    }

    currentDomNode = currentDomNode.parentElement;
  }

  return null;
}
