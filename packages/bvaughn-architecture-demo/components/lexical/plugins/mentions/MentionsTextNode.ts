import {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  NodeKey,
  TextModeType,
  TextNode,
} from "lexical";

import { Collaborator, SerializedMentionsTextNode } from "./types";
import $convertMentionsElement from "./utils/$convertMentionsElement";
import $createMentionsTextNode from "./utils/$createMentionsTextNode";
import styles from "./styles.module.css";

export default class MentionsTextNode extends TextNode {
  __id: string;
  __name: string;

  static getType(): string {
    return "mentions-item";
  }

  static clone(node: MentionsTextNode): MentionsTextNode {
    return new MentionsTextNode(node.__id, node.__name, node.__key);
  }

  static importJSON(serializedNode: SerializedMentionsTextNode): MentionsTextNode {
    const node = $createMentionsTextNode(serializedNode.id, serializedNode.name);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(id: string, name: string, key?: NodeKey) {
    super(`@${name}`, key);

    this.__id = id;
    this.__name = name;
  }

  exportJSON(): SerializedMentionsTextNode {
    return {
      ...super.exportJSON(),
      id: this.__id,
      name: this.__name,
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
    element.setAttribute("data-lexical-mentions-id", this.__id);
    element.setAttribute("data-lexical-mentions-name", this.__name);

    element.textContent = `@${this.__name}`;
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
