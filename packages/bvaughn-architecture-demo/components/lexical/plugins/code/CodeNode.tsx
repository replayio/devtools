import { EditorConfig, ElementNode } from "lexical";

import { SerializedCodeNode } from "./types";
import $createCodeNode from "./utils/$createCodeNode";

export default class CodeNode extends ElementNode {
  static getType(): string {
    return "code";
  }

  static clone(node: CodeNode): CodeNode {
    return new CodeNode(node.__key);
  }

  createDOM(_: EditorConfig): HTMLElement {
    const dom = document.createElement("div");
    dom.setAttribute("spellcheck", "false");
    return dom;
  }

  updateDOM(_: CodeNode, __: HTMLElement): boolean {
    return false;
  }

  exportJSON(): SerializedCodeNode {
    return {
      ...super.exportJSON(),
      type: "code",
      version: 1,
    };
  }

  static importJSON(_: SerializedCodeNode): CodeNode {
    const node = $createCodeNode();
    return node;
  }
}
