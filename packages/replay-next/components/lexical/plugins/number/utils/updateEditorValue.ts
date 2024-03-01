import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from "lexical";

export function updateEditorValue(editor: LexicalEditor, value: number) {
  editor.update(() => {
    const root = $getRoot();
    const firstChild = root.getFirstChild();
    if (firstChild) {
      const paragraphNode = $createParagraphNode();
      paragraphNode.append($createTextNode("" + value));

      firstChild.replace(paragraphNode);
    }
  });
}
