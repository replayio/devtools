import {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  NodeKey,
  TextModeType,
  TextNode,
} from "lexical";

import { SerializedMentionsTextNode } from "./types";
import $convertMentionsElement from "./utils/$convertMentionsElement";
import $createMentionsTextNode from "./utils/$createMentionsTextNode";
import styles from "./styles.module.css";

export default class MentionsTextNode extends TextNode {
  static getType(): string {
    return "mentions-item";
  }

  static clone(node: MentionsTextNode): MentionsTextNode {
    return new MentionsTextNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedMentionsTextNode): MentionsTextNode {
    const node = $createMentionsTextNode(serializedNode.text);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  exportJSON(): SerializedMentionsTextNode {
    return {
      ...super.exportJSON(),
      type: "mentions-item",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = styles.Node;
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-mentions-item", "true");
    element.textContent = this.__text;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-mentions-item")) {
          return null;
        }
        return {
          conversion: $convertMentionsElement,
          priority: 1,
        };
      },
    };
  }

  // Tokens get deleted all at once (not character by character)
  getMode(): TextModeType {
    return "token";
  }

  isTextEntity(): true {
    return true;
  }
}
