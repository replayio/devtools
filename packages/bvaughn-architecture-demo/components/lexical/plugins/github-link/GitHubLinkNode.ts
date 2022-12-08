import type { EditorConfig, LexicalNode, SerializedTextNode, Spread } from "lexical";
import { TextNode } from "lexical";

import { getFormattedText } from "./regex";
import styles from "./GitHubLink.module.css";

export type SerializedGitHubLinkNode = Spread<
  {
    type: "github-link";
    version: 1;
  },
  SerializedTextNode
>;

export class GitHubLinkNode extends TextNode {
  static getType(): string {
    return "github-link";
  }

  static clone(node: GitHubLinkNode): GitHubLinkNode {
    return new GitHubLinkNode(node.__text, node.__key);
  }

  static importJSON(serializedNode: SerializedGitHubLinkNode): GitHubLinkNode {
    const node = $createGitHubLinkNode(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedGitHubLinkNode {
    return {
      ...super.exportJSON(),
      type: "github-link",
      version: 1,
    };
  }

  createDOM(_: EditorConfig): HTMLElement {
    // const editableSpan = super.createDOM(config);
    const editableSpan = document.createElement("span");
    editableSpan.className = styles.Editable;

    const readOnlyLink = document.createElement("a");
    readOnlyLink.className = styles.ReadOnly;
    readOnlyLink.rel = "noreferrer";
    readOnlyLink.target = "_blank";

    this._updateDOMText(editableSpan, readOnlyLink);

    const dom = document.createElement("span");
    dom.className = styles.Link;
    dom.appendChild(editableSpan);
    dom.appendChild(readOnlyLink);

    return dom;
  }

  updateDOM(_: TextNode, dom: HTMLElement, __: EditorConfig): boolean {
    // if (super.updateDOM(prevNode, dom, config)) {
    //   return true;
    // }
    const editableSpan = dom.children[0] as HTMLSpanElement;
    const readOnlyLink = dom.children[1] as HTMLAnchorElement;

    this._updateDOMText(editableSpan, readOnlyLink);

    return false;
  }

  _updateDOMText(editableSpan: HTMLSpanElement, readOnlyLink: HTMLAnchorElement) {
    const text = this.__text;
    console.log(`_updateDOMText: "${text}"`);

    editableSpan.textContent = text;

    readOnlyLink.href = text;
    readOnlyLink.textContent = getFormattedText(text);
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  isTextEntity(): true {
    return true;
  }
}

export function $createGitHubLinkNode(text: string): GitHubLinkNode {
  return new GitHubLinkNode(text);
}

export function $isGitHubLinkNode(node: LexicalNode | null | undefined | undefined): boolean {
  return node instanceof GitHubLinkNode;
}
