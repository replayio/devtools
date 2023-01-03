import type {
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  GridSelection,
  LexicalNode,
  NodeKey,
  NodeSelection,
  RangeSelection,
  SerializedElementNode,
} from "lexical";
import { $isElementNode, $isRangeSelection, ElementNode, Spread } from "lexical";

import styles from "./AutoLink.module.css";

// Forked with modifications from packages/lexical-link/src/index

const DATA_FORMATTED_TEXT_ATTRIBUTE = "data-lexical-formatted-link";

export type SerializedLinkNode = Spread<
  {
    type: "link";
    formattedText: string | null;
    url: string;
    version: 1;
  },
  SerializedElementNode
>;

export class LinkNode extends ElementNode {
  __formattedText: string | null;
  __url: string;

  static getType(): string {
    return "link";
  }

  static clone(node: LinkNode): LinkNode {
    return new LinkNode(node.__url, node.__formattedText, node.__key);
  }

  constructor(url: string, formattedText: string | null, key?: NodeKey) {
    super(key);

    this.__formattedText = formattedText;
    this.__url = url;
  }

  createDOM(_: EditorConfig): HTMLAnchorElement {
    const anchor = document.createElement("a");
    anchor.className = styles.Link;
    anchor.href = this.__url;
    anchor.rel = "noopener noreferrer";
    anchor.target = "_blank";

    const formattedText = this.__formattedText;
    if (formattedText) {
      anchor.setAttribute(DATA_FORMATTED_TEXT_ATTRIBUTE, formattedText || "");
    }

    return anchor;
  }

  updateDOM(prevNode: LinkNode, anchor: HTMLAnchorElement, _: EditorConfig): boolean {
    const url = this.__url;
    if (url !== prevNode.__url) {
      anchor.href = url;
    }

    const formattedText = this.__formattedText;
    if (formattedText !== prevNode.__formattedText) {
      if (formattedText) {
        anchor.setAttribute(DATA_FORMATTED_TEXT_ATTRIBUTE, formattedText || "");
      } else {
        anchor.removeAttribute(DATA_FORMATTED_TEXT_ATTRIBUTE);
      }
    }

    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: (_: Node) => ({
        conversion: convertAnchorElement,
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedLinkNode | SerializedAutoLinkNode): LinkNode {
    const node = $createLinkNode(serializedNode.url, serializedNode.formattedText);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedLinkNode | SerializedAutoLinkNode {
    return {
      ...super.exportJSON(),
      type: "link",
      formattedText: this.getFormattedText(),
      url: this.getURL(),
      version: 1,
    };
  }

  getFormattedText(): string | null {
    return this.__formattedText;
  }
  setFormattedText(formattedText: string): void {
    const writable = this.getWritable();
    writable.__formattedText = formattedText;
  }

  getURL(): string {
    return this.getLatest().__url;
  }
  setURL(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  insertNewAfter(selection: RangeSelection): null | ElementNode {
    const element = this.getParentOrThrow().insertNewAfter(selection);
    if ($isElementNode(element)) {
      const linkNode = $createLinkNode(this.__url, this.__formattedText);
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }

  canInsertTextBefore(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }

  canBeEmpty(): false {
    return false;
  }

  isInline(): true {
    return true;
  }

  extractWithChild(
    _: LexicalNode,
    selection: RangeSelection | NodeSelection | GridSelection,
    __: "clone" | "html"
  ): boolean {
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    return (
      this.isParentOf(anchorNode) &&
      this.isParentOf(focusNode) &&
      selection.getTextContent().length > 0
    );
  }
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node = null;
  if (domNode instanceof HTMLAnchorElement) {
    const content = domNode.textContent;
    if (content !== null && content !== "") {
      node = $createLinkNode(
        domNode.getAttribute("href") || "",
        domNode.getAttribute(DATA_FORMATTED_TEXT_ATTRIBUTE) || null
      );
    }
  }
  return { node };
}

export function $createLinkNode(url: string, formattedText: string | null): LinkNode {
  return new LinkNode(url, formattedText);
}

export function $isLinkNode(node: LexicalNode | null | undefined): node is LinkNode {
  return node instanceof LinkNode;
}

export type SerializedAutoLinkNode = Spread<
  {
    type: "autolink";
    version: 1;
  },
  SerializedLinkNode
>;

// Custom node type to override `canInsertTextAfter` that will
// allow typing within the link
export class AutoLinkNode extends LinkNode {
  static getType(): string {
    return "autolink";
  }

  static clone(node: AutoLinkNode): AutoLinkNode {
    return new AutoLinkNode(node.__url, node.__formattedText, node.__key);
  }

  static importJSON(serializedNode: SerializedAutoLinkNode): AutoLinkNode {
    const node = $createAutoLinkNode(serializedNode.url, serializedNode.formattedText);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  static importDOM(): null {
    // TODO: Should link node should handle the import over autolink?
    return null;
  }

  exportJSON(): SerializedAutoLinkNode {
    return {
      ...super.exportJSON(),
      type: "autolink",
      version: 1,
    };
  }

  insertNewAfter(selection: RangeSelection): null | ElementNode {
    const element = this.getParentOrThrow().insertNewAfter(selection);
    if ($isElementNode(element)) {
      const linkNode = $createAutoLinkNode(this.__url, this.__formattedText);
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }
}

export function $createAutoLinkNode(url: string, formattedText: string | null): AutoLinkNode {
  return new AutoLinkNode(url, formattedText);
}

export function $isAutoLinkNode(node: LexicalNode | null | undefined): node is AutoLinkNode {
  return node instanceof AutoLinkNode;
}
