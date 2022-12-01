import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import { createElement, lazy } from "react";

const LoomLink = lazy(
  // @ts-ignore
  () => import("./LoomLink")
);

export type SerializedLoomLinkNode = Spread<
  {
    loomId: string;
    type: "loom-link";
    version: 1;
  },
  SerializedLexicalNode
>;

export class LoomLinkNode extends DecoratorNode<JSX.Element> {
  __loomId: string;

  static getType(): string {
    return "loom-link";
  }

  static clone(node: LoomLinkNode): LoomLinkNode {
    return new LoomLinkNode(node.__loomId, node.__key);
  }

  static importJSON(serializedNode: SerializedLoomLinkNode): LoomLinkNode {
    const { loomId } = serializedNode;
    const node = $createLoomLinkNode({ loomId });
    return node;
  }

  static loomIdToImageUrl(loomId: string): string {
    return `https://cdn.loom.com/sessions/thumbnails/${loomId}-with-play.jpg`;
  }

  static loomIdToShareUrl(loomId: string): string {
    return `https://www.loom.com/share/${loomId}`;
  }

  constructor(loomId: string, key?: NodeKey) {
    super(key);

    this.__loomId = loomId;
  }

  exportJSON(): SerializedLoomLinkNode {
    return {
      loomId: this.__loomId,
      type: "loom-link",
      version: 1,
    };
  }

  getLoomId(): string {
    return this.__loomId;
  }

  getTextContent(): string {
    return LoomLinkNode.loomIdToShareUrl(this.__loomId);
  }

  setWidthAndHeight(width: "inherit" | number, height: "inherit" | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return createElement(LoomLink, { loomId: this.__loomId });
  }
}

export function $createLoomLinkNode({
  key,
  loomId,
}: {
  key?: NodeKey;
  loomId: string;
}): LoomLinkNode {
  return $applyNodeReplacement(new LoomLinkNode(loomId, key));
}

export function $isLoomLinkNode(node: LexicalNode | null | undefined): node is LoomLinkNode {
  return node instanceof LoomLinkNode;
}
