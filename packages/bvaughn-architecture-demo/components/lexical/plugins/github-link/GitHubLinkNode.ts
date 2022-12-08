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

  createDOM(config: EditorConfig): HTMLElement {
    const editableSpan = super.createDOM(config);
    editableSpan.className = styles.Editable;

    const textContent = editableSpan.textContent ?? "";

    const readOnlyLink = document.createElement("a");
    readOnlyLink.className = styles.ReadOnly;
    readOnlyLink.href = textContent;
    readOnlyLink.rel = "noreferrer";
    readOnlyLink.target = "_blank";
    readOnlyLink.textContent = getFormattedText(textContent);

    const dom = document.createElement("span");
    dom.className = styles.Link;
    dom.appendChild(editableSpan);
    dom.appendChild(readOnlyLink);

    return dom;
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
