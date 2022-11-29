import { EditorConfig, ElementNode } from "lexical";

import { SerializedCodeNode } from "./types";
import $createCodeNode from "./utils/$createCodeNode";
import "./styles.css";

export default class CodeNode extends ElementNode {
  static getType(): string {
    return "code";
  }

  static clone(node: CodeNode): CodeNode {
    return new CodeNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("div");
    return dom;
  }

  updateDOM(prevNode: CodeNode, dom: HTMLElement): boolean {
    return false;
  }

  exportJSON(): SerializedCodeNode {
    return {
      ...super.exportJSON(),
      type: "code",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedCodeNode): CodeNode {
    const node = $createCodeNode();
    return node;
  }
}
