import type {
  DOMConversionOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import * as React from "react";
import { lazy } from "react";

const LoomThumbnail = lazy(
  // @ts-ignore
  () => import("./LoomThumbnail")
);

export interface ImagePayload {
  key?: NodeKey;
  loomId: string;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const loomId = domNode.getAttribute("data-loom-id")!;
    const node = $createLoomThumbnailNode({ loomId });
    return { node };
  }
  return null;
}

export type SerializedLoomThumbnailNode = Spread<
  {
    loomId: string;
    type: "loom-thumbnail";
    version: 1;
  },
  SerializedLexicalNode
>;

export class LoomThumbnailNode extends DecoratorNode<JSX.Element> {
  __loomId: string;

  static getType(): string {
    return "loom-thumbnail";
  }

  static clone(node: LoomThumbnailNode): LoomThumbnailNode {
    return new LoomThumbnailNode(node.__loomId, node.__key);
  }

  static importJSON(serializedNode: SerializedLoomThumbnailNode): LoomThumbnailNode {
    const { loomId } = serializedNode;
    const node = $createLoomThumbnailNode({ loomId });
    return node;
  }

  // TODO Do we need to support
  // exportDOM(): DOMExportOutput {
  //   const loomId = this.__loomId;

  //   const image = document.createElement('img');
  //   image.className = 'loom-thumbnail';
  //   image.setAttribute('data-loom-id', loomId);
  //   image.setAttribute('src', LoomThumbnailNode.loomIdToImageUrl(loomId));

  //   const link = document.createElement('a');
  //   link.setAttribute('href', LoomThumbnailNode.loomIdToShareUrl(loomId));
  //   link.setAttribute('rel', 'noreferrer');
  //   link.setAttribute('target', '_blank');
  //   link.appendChild(image);

  //   return {element: link};
  // }

  // static importDOM(): DOMConversionMap | null {
  //   return {
  //     image: (node: Node) => ({
  //       conversion: convertImageElement,
  //       priority: 0,
  //     }),
  //   };
  // }

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

  exportJSON(): SerializedLoomThumbnailNode {
    return {
      loomId: this.__loomId,
      type: "loom-thumbnail",
      version: 1,
    };
  }

  getTextContent(): string {
    return LoomThumbnailNode.loomIdToImageUrl(this.__loomId);
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
    return <LoomThumbnail loomId={this.__loomId} />;
  }
}

export function $createLoomThumbnailNode({ key, loomId }: ImagePayload): LoomThumbnailNode {
  return $applyNodeReplacement(new LoomThumbnailNode(loomId, key));
}

export function $isLoomThumbnailNode(
  node: LexicalNode | null | undefined
): node is LoomThumbnailNode {
  return node instanceof LoomThumbnailNode;
}
